'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var qs = _interopDefault(require('qs'));
var urlJoin = _interopDefault(require('url-join'));

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
    if (signal.aborted) {
      abortController.abort();
    } else {
      signal.addEventListener("abort", () => abortController.abort());
    }
  } // when the Flighty abortController aborts, also abort this request


  controller.signal.addEventListener("abort", () => abortController.abort());
  return abortController.signal;
};

const retryDelayFn = delay => new Promise(res => setTimeout(() => res(), delay));

const checkFn = (fn, err) => {
  if (typeof fn !== "function") {
    throw new Error(err);
  }
};

const asyncRetry = async (asyncFnToRetry, {
  retries = 0,
  retryDelay = 1000,
  retryFn
}) => {
  checkFn(asyncFnToRetry, "retry function is not a function");

  if (isNaN(retries) || retries < 0) {
    throw new Error("retries must be a number greater than or equal to 0");
  }

  if (retryDelay && isNaN(retryDelay)) {
    throw new Error("retryDelay must be a number (milliseconds)");
  }

  if (retryFn && typeof retryFn !== "function") {
    throw new Error("retryFn must be callable");
  }

  const _retryFn = async (...args) => retryFn ? retryFn(...args) : retryDelayFn(retryDelay);

  let count = -1;

  const wrap = async retries => {
    try {
      count++;
      return await asyncFnToRetry(count);
    } catch (err) {
      if (!retries) {
        throw err;
      }

      await _retryFn(count + 1, err);
      return wrap(--retries);
    }
  };

  const res = await wrap(retries);
  return {
    count,
    res
  };
};
const fetchRetry = async (fetchToRetry, {
  retries,
  retryDelay,
  retryFn,
  retryOn = [],
  signal
}) => {
  checkFn(fetchToRetry, "retry function is not a function");

  if (retryOn && !Array.isArray(retryOn)) {
    throw new Error("retryOn must be an array of response statii");
  }

  if (signal != null && typeof signal.aborted !== "boolean") {
    throw new Error('signal must have boolean "aborted" property');
  }
  return asyncRetry(async retryCount => {
    const res = await fetchToRetry();

    if (retryOn.indexOf(res.status) === -1 || retries === retryCount) {
      return res;
    }

    throw new Error(res);
  }, {
    retries,
    retryFn: async (count, err) => {
      if (signal && signal.aborted) {
        throw err;
      }

      if (retryFn) {
        return retryFn(count, err);
      }

      return retryDelayFn(retryDelay);
    }
  });
};

if (typeof fetch === "undefined" || typeof AbortController === "undefined") {
  let which;

  if (typeof fetch === "undefined") {
    which = "You're missing a fetch implementation.";
  } else {
    which = "You're missing an AbortController implementation.";
  }

  throw new Error(`${which} Try var Flighty = require('flighty/fetch') or import Flighty from 'flighty/fetch'"`);
}

const METHODS = ["GET", "POST", "PUT", "HEAD", "OPTIONS", "DEL", "PATCH"];

const doFetch = (method, context, path, options) => {
  const opts = { ...options,
    method: method === 'del' ? "DELETE" : method.toUpperCase(),
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

const call = (method, context, {
  path,
  options
}, extra, retryCount = 0) => {
  // strip out interceptor-immutable or non-fetch options
  const {
    retries = 0,
    retryDelay = 1000,
    retryOn = [],
    retryFn,
    abortToken,
    signal,
    ...fetchOptions
  } = options;
  const flightyAbortSignal = setupAbort({
    abortToken,
    signal
  }, context.abortController, context.abortTokenMap); // flighty object

  const flighty = {
    method,
    // the values flighty was called with
    call: {
      path: path,
      options: { ...options
      },
      extra: { ...extra
      }
    },
    // retry method
    retry: () => {
      retryCount++;
      return call(method, context, {
        path: path,
        options: { ...options
        }
      }, { ...extra
      }, retryCount);
    }
  };
  const interceptors = Array.from(context.interceptors);
  const req = interceptors.reduce((last, next) => {
    // add in extra and retryCount to each interceptor
    last = last.then(args => args.slice(0, 2).concat([{ ...extra
    }, retryCount]));

    if (next.request) {
      last = last.then(args => next.request(...args));
    }

    if (next.requestError) {
      last = last.catch(next.requestError);
    }

    return last;
  }, Promise.resolve([path, fetchOptions]));
  const res = interceptors.reverse().reduce((last, next) => {
    if (next.response) {
      last = last.then(next.response);
    }

    if (next.responseError) {
      last = last.catch(next.responseError);
    }

    return last;
  }, (async () => {
    // stuff from the interceptors
    const [path, options] = await req;
    const {
      count,
      res
    } = await fetchRetry(() => doFetch(method, context, path, { ...options,
      signal: flightyAbortSignal
    }), {
      retries,
      retryDelay,
      retryOn,
      retryFn,
      signal: flightyAbortSignal
    });
    retryCount += count;
    res.flighty = flighty;
    let json, text;

    try {
      json = await res.clone().json();
    } catch (e) {}

    try {
      text = await res.clone().text();
    } catch (e) {}

    res.flighty = { ...flighty,
      retryCount,
      json,
      text
    };
    return res;
  })());
  return res.finally(() => teardownAbort(abortToken, context.abortTokenMap));
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
    this.headers = { ...this.headers,
      Authorization: token ? `Bearer ${token}` : null
    };
    return this;
  }

}

module.exports = Flighty;
