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

const METHODS = ["GET", "POST", "PUT", "HEAD", "OPTIONS", "DELETE"];

const doFetch = (method, context, path, options) => {
  // keep abortToken out of the fetch params
  const { abortToken, ...rest } = options;

  const opts = {
    ...rest,
    method,
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

const call = async (method, context, { path, options }) => {
  options.signal = setupAbort(
    options,
    context.abortController,
    context.abortTokenMap
  );

  const interceptors = Array.from(context.interceptors);
  const req = asyncReduce(
    interceptors,
    Promise.resolve({ path, options }),
    "request",
    "requestError"
  );

  const res = asyncReduce(
    interceptors.reverse(),
    (async () => {
      const { path, options } = await req;
      return doFetch(method, context, path, options);
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
        (this[method.toLowerCase()] = (path = "/", options = {}) =>
          call(method, this, { path, options }))
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
      opts: {
        get() {
          return options;
        },
        set(opts = {}) {
          options = { ...opts };
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
            unregister: interceptor => this.interceptors.delete(interceptor),
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
    if (!val) {
      return;
    }
    val.controller.abort();
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

  jwt(token) {
    this.headers = {
      ...this.headers,
      Authorization: token ? `Bearer ${token}` : null
    };
  }
}
