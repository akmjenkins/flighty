import qs from "qs";
import urlJoin from "url-join";
import asyncReduce from "./async-reduce";
import { setupAbort, teardownAbort } from "./abort";

if (typeof fetch === "undefined") {
  throw new Error(
    "You need a fetch implementation. Try npm install cross-fetch"
  );
}

if (typeof AbortController === "undefined") {
  throw new Error(
    "You're missing an AbortController implementation. Try npm install abortcontroller-polyfill"
  );
}

const METHODS = ["GET", "POST", "PUT", "HEAD", "OPTIONS", "DEL", "PATCH"];

const doFetch = (method, context, path, options) => {
  // keep abortToken out of the fetch params
  const { abortToken, ...rest } = options;

  const opts = {
    ...rest,
    method: method === 'del' ? "DELETE" : method.toUpperCase(),
    headers: {
      ...(context.headers || {}),
      ...options.headers
    }
  };

  // remove any nil or blank headers
  opts.headers = Object.keys(opts.headers).reduce((carry, key) => {
    const value = opts.headers[key];
    return value ? { [key]: value, ...carry } : carry;
  }, {});

  if (!opts.body && method === "POST") {
    opts.body = "";
  }

  if (method === "GET" && opts.body) {
    path += `?${qs.stringify(opts.body, { arrayFormat: context.arrayFormat })}`;
    delete opts.body;
  }

  if (opts.body && typeof opts.body === "object") {
    opts.body = JSON.stringify(opts.body);
  }

  const fullUri = context.baseURI ? urlJoin(context.baseURI, path) : path;
  return fetch(fullUri, opts);
};

const call = async (
  method,
  context,
  { path, options },
  extra,
  retryCount = 0
) => {
  // don't let the interceptors modify the abort signal - it's the one
  // attached to flighty's abortController so if they do, it will break our
  // "abortAll" method
  const signal = setupAbort(
    options,
    context.abortController,
    context.abortTokenMap
  );
  const originalOptions = { ...options };
  const originalExtra = { ...extra };
  const originalPath = path;

  const returnedFromInterceptors = [];
  const interceptors = Array.from(context.interceptors);
  const req = asyncReduce(
    interceptors,
    Promise.resolve([path, options, {...extra}, retryCount]),
    "request",
    "requestError",
    // don't let interceptors modify the extra or retryCount data
    args => {
      const [path,options] = args.slice(0, 2);
      returnedFromInterceptors.push([path,{...options}]);
      return [path,options].concat([{ ...extra }, retryCount]);
    }
  );

  const res = asyncReduce(
    interceptors.reverse(),
    (async () => {
      // stuff from the interceptors
      const [path, options] = await req;
      returnedFromInterceptors.push([path,{...options}]);
      const res = await doFetch(method, context, path, { ...options, signal });
      res.flighty = {
        method,
        retryCount,
        // the values flighty was called with
        call: {
          path: originalPath,
          options: originalOptions,
          extra: originalExtra
        },
        // the values that were returned from each request interceptor - useful for debugging!
        intercepted:returnedFromInterceptors,
        // retry method
        retry: async () => {
          retryCount++;
          return await call(
            method,
            context,
            { path: originalPath, options: originalOptions },
            originalExtra,
            retryCount
          );
        }
      };

      // add in the json and text responses to extra to make life easier
      // for people - they can still await them if they want
      if (res) {
        try {
          res.flighty.json = await res.clone().json();
        } catch (e) {}
        try {
          res.flighty.text = await res.clone().text();
        } catch (e) {}
      }

      return res;
    })(),
    "response",
    "responseError"
  );

  try {
    await res;
  } catch (e) {}

  teardownAbort(options.abortToken, context.abortTokenMap);

  return res;
};

export default class Flighty {
  constructor(options = {}) {
    // add the methods
    METHODS.forEach(
      method =>
        (this[method.toLowerCase()] = (path = "/", options = {}, extra = {}) =>
          call(method, this, { path, options }, extra))
    );

    let localAbortController;
    const interceptors = new Set();
    const abortTokenMap = new Map();
    Object.defineProperties(this, {
      headers: {
        get() {
          return options.headers;
        },
        set(headers = {}) {
          options = {
            ...options,
            headers
          };
        }
      },
      arrayFormat: {
        get() {
          return options.arrayFormat || "indicies";
        }
      },
      baseURI: {
        get() {
          return options.baseURI;
        },
        set(baseURI) {
          options = {
            ...options,
            baseURI
          };
        }
      },
      interceptors: {
        get() {
          return interceptors;
        }
      },

      interceptor: {
        get() {
          return {
            register: interceptor => this.registerInterceptor(interceptor),
            unregister: interceptor => this.removeInterceptor(interceptor),
            clear: () => this.clearInterceptors()
          };
        }
      },

      abortController: {
        get() {
          if (!localAbortController) {
            localAbortController = new AbortController();
            localAbortController.signal.addEventListener("abort", () => {
              // when this is aborted, null out the localAbortController
              // so we'll create a new one next time we need it
              localAbortController = null;
            });
          }
          return localAbortController;
        }
      },

      abortTokenMap: {
        get() {
          return abortTokenMap;
        }
      }
    });
  }

  abort(token) {
    const val = this.abortTokenMap.get(token);
    return val && val.controller.abort();
  }

  abortAll() {
    this.abortController.abort();
  }

  registerInterceptor(interceptor) {
    if (!interceptor) {
      throw new Error("cannot register a null interceptor");
    }

    this.interceptors.add(interceptor);
    return () => this.interceptors.delete(interceptor);
  }

  clearInterceptors() {
    this.interceptors.clear();
  }

  removeInterceptor(interceptor) {
    this.interceptors.delete(interceptor);
  }

  jwt(token) {
    this.headers = {
      ...this.headers,
      Authorization: token ? `Bearer ${token}` : null
    };
    return this;
  }

}
