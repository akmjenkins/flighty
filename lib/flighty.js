'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var qs = _interopDefault(require('qs'));
var urlJoin = _interopDefault(require('url-join'));

function async(arr, start, thenMethod, catchMethod) {
  return arr.reduce((last, next) => {
    if (next[thenMethod]) {
      last = last.then(next[thenMethod]);
    }

    if (next[catchMethod]) {
      last = last.catch(next[catchMethod]);
    }

    return last;
  }, start);
}

const teardownAbort = (token, map) => {
  if (!token) {
    return;
  }

  const val = map.get(token);

  if (!val || --val.count) {
    return;
  }

  map.delete(token);
};

const setupAbort = ({
  abortToken,
  signal
}, controller, map) => {
  // if there is no token or signal, use Flighty abortController
  if (!abortToken && !signal) {
    return controller.signal;
  } // otherwise, use an abortController local to this request


  let abortController = new AbortController();

  if (abortToken) {
    // allow to use a single token to cancel multiple requests
    const mapValue = map.get(abortToken) || {
      controller: abortController,
      count: 0
    };
    mapValue.count++;
    map.set(abortToken, mapValue);
    abortController = mapValue.controller;
  } // the user has defined their own signal. We won't use it directly, but we'll listen to it


  if (signal) {
    signal.addEventListener("abort", () => abortController.abort());
  } // when the Flighty abortController aborts, also abort this request


  controller.signal.addEventListener("abort", () => abortController.abort());
  return abortController.signal;
};

if (typeof fetch === "undefined") {
  throw new Error("You need a fetch implementation. Try npm install cross-fetch");
}

if (typeof AbortController === "undefined") {
  throw new Error("You're missing an AbortController implementation. Try npm install abortcontroller-polyfill");
}

const METHODS = ["GET", "POST", "PUT", "HEAD", "OPTIONS", "DELETE"];

const doFetch = (method, context, path, options) => {
  // keep abortToken out of the fetch params
  const {
    abortToken,
    ...rest
  } = options;
  const opts = { ...rest,
    method,
    headers: { ...(context.headers || {}),
      ...options.headers
    }
  }; // remove any nil or blank headers

  opts.headers = Object.keys(opts.headers).reduce((carry, key) => {
    const value = opts.headers[key];
    return value ? {
      [key]: value,
      ...carry
    } : carry;
  }, {});

  if (!opts.body && method === "POST") {
    opts.body = "";
  }

  if (method === "GET" && opts.body) {
    path += `?${qs.stringify(opts.body, {
      arrayFormat: context.arrayFormat
    })}`;
    delete opts.body;
  }

  if (opts.body && typeof opts.body === "object") {
    opts.body = JSON.stringify(opts.body);
  }

  const fullUri = context.baseURI ? urlJoin(context.baseURI, path) : path;
  return fetch(fullUri, opts);
};

const call = async (method, context, {
  path,
  options
}, extra = {}) => {
  options.signal = setupAbort(options, context.abortController, context.abortTokenMap);
  extra.retry = extra.retry || 0;

  const retry = () => {
    return call(method, context, {
      path,
      options
    }, { ...extra,
      retry: extra.retry + 1
    });
  };

  const interceptors = Array.from(context.interceptors);
  const req = async(interceptors, Promise.resolve({
    path,
    options,
    extra
  }), "request", "requestError");
  const res = async(interceptors.reverse(), (async () => {
    const {
      path,
      options
    } = await req;
    const res = doFetch(method, context, path, options);
    return {
      res: await res,
      retry,
      extra
    };
  })(), "response", "responseError");

  try {
    await res;
  } catch (e) {}

  teardownAbort(options.abortToken, context.abortTokenMap);
  return res;
};

class Flighty {
  constructor(options = {}) {
    // add the methods
    METHODS.forEach(method => this[method.toLowerCase()] = (path = "/", options = {}, extra = {}) => call(method, this, {
      path,
      options
    }, extra));
    let localAbortController;
    const interceptors = new Set();
    const abortTokenMap = new Map();
    Object.defineProperties(this, {
      headers: {
        get() {
          return options.headers;
        },

        set(headers = {}) {
          options = { ...options,
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
          options = { ...options,
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

  jwt(token) {
    this.headers = { ...this.headers,
      Authorization: token ? `Bearer ${token}` : null
    };
  }

}

exports.default = Flighty;
