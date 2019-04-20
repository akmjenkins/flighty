import qs from 'qs';
import urlJoin from 'url-join';
import { setupAbort, teardownAbort } from './abort';
import { fetchRetry } from './retry';

if (typeof fetch === 'undefined') {
  throw new Error("You're missing a fetch implementation. Try var Flighty = require('flighty/fetch') or import Flighty from 'flighty/fetch'");
}

if (typeof AbortController === 'undefined') {
  throw new Error("You're missing an AbortController implementation. Try var Flighty = require('flighty/abort') or import Flighty from 'flighty/abort'");
}

const METHODS = ['GET', 'POST', 'PUT', 'HEAD', 'OPTIONS', 'DEL', 'PATCH'];

const doFetch = (method, context, path, options) => {
  const opts = {
    ...options,
    method: method === 'del' ? 'DELETE' : method.toUpperCase(),
    headers: {
      ...(context.headers || {}),
      ...options.headers,
    },
  };

  // remove any nil or blank headers
  opts.headers = Object.keys(opts.headers).reduce((carry, key) => {
    const value = opts.headers[key];
    return value ? { [key]: value, ...carry } : carry;
  }, {});

  if (!opts.body && method === 'POST') {
    opts.body = '';
  }

  let fetchPath = path;
  if (method === 'GET' && opts.body) {
    fetchPath += `?${qs.stringify(opts.body, { arrayFormat: context.arrayFormat })}`;
    delete opts.body;
  }

  if (opts.body && typeof opts.body === 'object') {
    opts.body = JSON.stringify(opts.body);
  }

  const fullUri = context.baseURI ? urlJoin(context.baseURI, fetchPath) : fetchPath;
  return fetch(fullUri, opts);
};

const call = async (
  method,
  context,
  { path, options },
  extra,
  retryCount = 0,
) => {
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

  const flightyAbortSignal = setupAbort(
    { abortToken, signal },
    context.abortController,
    context.abortTokenMap,
  );

  let numRetries = retryCount;
  // flighty object
  const flighty = {
    method,
    // the values flighty was called with
    call: {
      path,
      options: { ...options },
      extra: { ...extra },
    },
    // retry method
    retry: () => {
      numRetries += 1;
      return call(
        method,
        context,
        { path, options: { ...options } },
        { ...extra },
        numRetries,
      );
    },
  };

  const interceptors = Array.from(context.interceptors);

  const req = interceptors.reduce((last, next) => {
    let p = last;
    // add in extra and retryCount to each interceptor
    p = p.then(args => args.slice(0, 2).concat([{ ...extra }, retryCount]));

    if (next.request) { p = p.then(args => next.request(...args)); }
    if (next.requestError) { p = p.catch(next.requestError); }
    return p;
  }, Promise.resolve([path, fetchOptions]));

  const flightyRes = interceptors.reverse().reduce((last, next) => {
    let p = last;
    if (next.response) { p = p.then(next.response); }
    if (next.responseError) { p = p.catch(next.responseError); }
    return p;
  }, (async () => {
    // stuff from the interceptors
    const [reqPath, reqOptions] = await req;
    const { count, res } = await fetchRetry(
      () => doFetch(method, context, reqPath, { ...reqOptions, signal: flightyAbortSignal }),
      {
        retries,
        retryDelay,
        retryOn,
        retryFn,
        signal: flightyAbortSignal,
      },
    );

    numRetries += count;
    res.flighty = flighty;

    let json; let text;
    try {
      json = await res.clone().json();
    } catch (err) {
      // stub - don't care
    }
    try {
      text = await res.clone().text();
    } catch (err) {
      // stub - don't care
    }

    res.flighty = {
      ...flighty,
      retryCount: numRetries,
      json,
      text,
    };
    return res;
  })());

  try {
    return await flightyRes;
  } catch (err) {
    throw err;
  } finally {
    teardownAbort(abortToken, context.abortTokenMap);
  }
};

class Flighty {
  constructor(baseOptions = {}) {
    // add the methods
    let localOptions = { ...baseOptions };
    METHODS.forEach((method) => {
      this[method.toLowerCase()] = (path = '/', options = {}, extra = {}) => call(method, this, { path, options }, extra);
    });

    let localAbortController;
    const interceptors = new Set();
    const abortTokenMap = new Map();
    Object.defineProperties(this, {
      headers: {
        get() {
          return localOptions.headers;
        },
        set(headers = {}) {
          localOptions = {
            ...localOptions,
            headers,
          };
        },
      },
      arrayFormat: {
        get() {
          return localOptions.arrayFormat || 'indicies';
        },
      },
      baseURI: {
        get() {
          return localOptions.baseURI;
        },
        set(baseURI) {
          localOptions = {
            ...localOptions,
            baseURI,
          };
        },
      },
      interceptors: {
        get() {
          return interceptors;
        },
      },

      interceptor: {
        get() {
          return {
            register: interceptor => this.registerInterceptor(interceptor),
            unregister: interceptor => this.removeInterceptor(interceptor),
            clear: () => this.clearInterceptors(),
          };
        },
      },

      abortController: {
        get() {
          if (!localAbortController) {
            localAbortController = new AbortController();
            localAbortController.signal.addEventListener('abort', () => {
              // when this is aborted, null out the localAbortController
              // so we'll create a new one next time we need it
              localAbortController = null;
            });
          }
          return localAbortController;
        },
      },

      abortTokenMap: {
        get() {
          return abortTokenMap;
        },
      },
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
      throw new Error('cannot register a null interceptor');
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

  auth(username, password) {
    const base64Implementation = (string) => {
      if (typeof btoa !== 'undefined') {
        return btoa(string);
      }

      return Buffer.from(string).toString('base64');
    };
    this.headers = {
      ...this.headers,
      Authorization: username && password ? `Basic ${base64Implementation(`${username}:${password}`)}` : null,
    };
  }

  jwt(token) {
    this.headers = {
      ...this.headers,
      Authorization: token ? `Bearer ${token}` : null,
    };
    return this;
  }
}

const flighty = new Flighty();
flighty.create = baseOptions => new Flighty(baseOptions);

export default flighty;
