import qs from "qs";
import urlJoin from "url-join";
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

  const opts = {
    ...options,
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

const call = (
  method,
  context,
  { path, options },
  extra,
  retryCount = 0
) => {

  // strip out interceptor-immutable or non-fetch options
  const {
    abortToken,
    signal,
    ...fetchOptions
  } = options;

  const flightyAbortSignal = setupAbort(
    {abortToken,signal},
    context.abortController,
    context.abortTokenMap
  );

  // flighty object
  const flighty = {
    method,
    retryCount,
    // the values flighty was called with
    call: {
      path: path,
      options: { ...options },
      extra: { ...extra }
    },
    // retry method
    retry: () => {
      retryCount++;
      return call(
        method,
        context,
        { path: path, options: { ...options } },
        { ...extra },
        retryCount
      );
    }
  }

  const interceptors = Array.from(context.interceptors);

  const req = interceptors.reduce((last,next) => {
    // add in extra and retryCount to each interceptor
    last = last.then(args => args.slice(0,2).concat([{ ...extra }, retryCount]))

    if(next.request) { last = last.then(args => next.request(...args)); }
    if(next.requestError) { last = last.catch(next.requestError); }
    return last;
  },Promise.resolve([path, fetchOptions]));

  const res = interceptors.reverse().reduce((last,next) => {
    if(next.response) { last = last.then(next.response); }
    if(next.responseError) { last = last.catch(next.responseError); }
    return last;
  },(async () => {
    // stuff from the interceptors
    const [path, options] = await req;
    const res = await doFetch(method, context, path, {...options,signal:flightyAbortSignal});
    res.flighty = flighty;

    let json,text;
    try {
      json = await res.clone().json();
    } catch (e) {}
    try {
      text = await res.clone().text();
    } catch (e) {}

    res.flighty = {
      ...flighty,
      json,
      text
    }
    return res;
  })());

  return res.finally(() => teardownAbort(abortToken, context.abortTokenMap));
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
