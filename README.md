# Flighty ✈️

[![codecov](https://codecov.io/gh/akmjenkins/flighty/branch/master/graph/badge.svg)](https://codecov.io/gh/akmjenkins/flighty) [![Build Status](https://travis-ci.org/akmjenkins/flighty.svg?branch=master)](https://travis-ci.org/akmjenkins/flighty)

Simple (and tiny) fetch wrapper with nifty features such as intercepts, easy aborts, and retries, for everywhere.

## Motivation

Various fetch-wrapping libraries have some of these features, but few (if any) have them all.

Also, with the majority of environments nowadays supporting fetch, including a full fetch implementation (via cross-fetch) in the build is largely unnecessary. Plus, it allows us to keep this thing tiny.

Flighty weighs a hefty 5.8kb minified and gzipped (14.7kb without the gzip) with included dependencies [qs](https://www.npmjs.com/package/qs) and [url-join](https://www.npmjs.com/package/url-join) (doesn't include fetch!)

If you want to polyfill fetch it'll cost you bigly - a total of 8.3kb (minified and gzipped) - 22.9kb without the gzip!.

## Use it in Unit testing

The more mocks in your unit tests the worse so here's a thing - don't mock Flighty! Rather than create mocks of fetch-wrapping libraries and functionality, why not just mock the only thing you should need to - the fetch itself? I recommend [jest-fetch-mock](https://www.npmjs.com/package/jest-fetch-mock).

## Features

**_Drop in replacement_** for fetch (we're still using fetch, just wrapping it) This works:

```
const res = await fetch('/somepath',{some options});

const api = new Flighty({some options});
const res = await api.get('/somepath',{some options});
```

This works because Flighty returns the standard [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) but with the addition of the 🎉**flighty object**🎉

### flighty object

```

res.flighty = {
  method, // the method you called with
  retryCount, // the number of times this request has been retried
  json, // what you'd normally get from await res.json()
  text, // what you'd normally get from await res.text()
  // the values the original flighty request was called with
  call: {
    path,
    options,
    extra
  },
  // the values that were returned from an interceptor - useful for debugging!
  intercepted: {
    path,
    options,
    extra
  },
  // retry method - calls the same request you made the first time again - hello JWT 401s
  retry: async ()
}

```

### Easy Abort

Frisbee comes with two abort APIs. `abortAll()` which cancels all ongoing requests and cancellation via an `abortToken` (similar to [axios cancellation token](https://github.com/axios/axios#cancellation) but easier!).

Aborting Fetch requests comes with a hairy, verbose [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) API that requires you to construct, pass in a signal to the fetch, and then abort the controller like so:

```

  const controller = new AbortController();
  const req = fetch('/',{controller.signal})

  controller.abort();

  try {
    const res = await req;
  } catch(err) {
    // AbortError!
  }

```

Flighty allows you to pass in a token (any Symbol) and then call `abort(token)` to cancel the request.

```
  const abortToken = "my abort token";
  const req = flighty.get('/',{abortToken});

  api.abort(abortToken);

  try {
    const res = await req;
  } catch(err) {
    // AbortError!
  }
```

Tokens, like AbortController signals, can be used to abort multiple requests, but I've found it "feels" easier (IMO) to call `api.abort(someToken)` than to call `myAbortController.abort()`. If you've got multiple requests that you need manage the cancellation of independently, you've got to create and manage multiple AbortControllers - let flighty do this work for you.

Like signals, a single abortToken can cancel multiple requests!

```
 const abortToken = "some token";
 const reqOne = flighty('/pathone',{abortToken})
 const reqTwo = flighty('/pathtwo',{abortToken})
 const reqThree = flighty('/paththree',{abortToken})

 // cancel them all!
 flighty.abort(abortToken);

```

### Interceptors

Drop in replacement for anybody using Frisbee interceptors or [fetch-intercept](https://www.npmjs.com/package/fetch-intercept), but with a couple of extra things:

```js
const interceptor = {
  request: (path,options,extra,retryCount) => {

    // extra is an immutable object of the data passed in when creating the request - e.g. flighty('/mypath',{myFetchOptions},{someExtraData})
    // it won't get changed between interceptors if you modify it.

    // retryCount is the number of times this request has been retried via res.flighty.retry() - immutable


    return [path,options];
  }
}
```

Here's the full interceptor object:
```js
{
request: function (path, options, extra, retryCount) {
    // extra and retryCount are immutable - do what you want with them
    // they'll be passed to each interceptor the same
    return [path, options];
},
requestError: function (err) {
    // Handle an error occurred in the request method
    return Promise.reject(err);
},
response: function (response) {
    // do something with response (or res.flighty!)
    return response;
},
responseError: function (err) {
    // Handle error occurred in the last ran requestInterceptor, or the fetch itself
    return Promise.reject(err);
}
```

### Retries

I've found retries (combined with response interceptors) to be invaluable when working with [JWTs](https://jwt.io/). Get a 401 from your API? Intercept it in the response, get a new accessToken and then retry the request.

```
  let res;
  const api = new Flighty();
  res = await api.get('/');

  if(!res.ok && res.flighty.retryCount === 0) {
    // try it one more time...
    res = res.flighty.retry();
  }
```

## API

* `Flighty` - accepts an `options` object, with the following accepted options:

  * `baseURI` - the default URI use to prefix all your paths

  * `headers` - an object containing default headers to send with every request

  * `arrayFormat` - how to stringify array in passed body. See [qs][qs-url] for available formats

Upon being invoked, `Flighty` has the following methods

* `api.jwt(token)` - Set your Bearer Authorization header via this method. Pass in a token and Flighty will add the header for you, pass in something false-y and Flighty won't automatically add an auth header (in case you want to do it yourself)

* HTTP wrapper methods (e.g. get, post, put, delete, etc) require a `path` string, and accept two optional plain object arguments - `options` and `extra`

  * Accepted method arguments:

    * `path` **required** - the path for the HTTP request (e.g. `/v1/login`, will be prefixed with the value of `baseURI` if set)

    * `options` _optional_ - everything you'd pass into fetch's [init](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) plus an optional `abortToken`

    * `extra` _optional_ object - sometimes you have some meta data about a request that you may want interceptors or other various listeners to know about. Whatever you pass in here will come out the other end attached the to `res.flighty.call` object and will also be passed along to all interceptors along the way

  * List of available HTTP methods:

    * `api.get(path, options, extra)` - GET
    * `api.head(path, options, extra)` - HEAD
    * `api.post(path, options, extra)` - POST
    * `api.put(path, options, extra)` - PUT
    * `api.del(path, options, extra)` - DELETE
    * `api.options(path, options, extra)` - OPTIONS
    * `api.patch(path, options, extra)` - PATCH

* `registerInterceptor` - method that accepts an `interceptor` and calls it on every fetch. Returns a function that allows you to remove it:

  ```js
    const api = new Flighty({});
    const undo = api.registerInterceptor(someInterceptor);
    await api.get('/'); // your interceptor will run
    undo(); // your interceptor is gone!
  ```

* `removeInterceptor` - method that accepts an reference to interceptor and removes it


* `clearInterceptors` - removes all interceptors.

For convenience, Flighty has exposed an `interceptor` property that has the same API as frisbee to register and unregister interceptors.

* `interceptor` - object that can be used to manipulate request and response interceptors. It has the following methods:

  * `api.interceptor.register(interceptor)`:

  * `api.interceptor.unregister(interceptor)`:

  * `api.interceptor.clear()`:


### Throw if not 2xx recipe

Don't know about you, but I found it annoying that I always had to check `res.ok` to handle my error conditions - why not just throw if the response isn't ok? Interceptor!

Before:
```js

  const res = await fetch('/');
  if(res.ok) {
    // do some good stuff
  } else {
    // do some bad stuff
  }

```

After:
```js
const api = new Flighty();
api.registerInterceptor({
  response:res {
    if(!res.ok) {
      throw res;
    }
    return res;
  }
});

// Now all my responses throw if I get a crap response
try {
  const res = api.get('/');
} catch(e) {
  // response returned non-2xx
}
```

### JWT Recipe with Retries and Interceptors

```

const api = new Flighty();

const interceptor = {
  request:(path,options) {
    api.jwt(path === REFRESH_ENDPOINT ? myRefreshToken : myAccessToken);
    return [path,options]
  },
  response:async res {

    // our only job when hitting the login path is to set the tokens locally
    if(path === LOGIN_ENDPOINT) {
      if(res.ok) {
        // store your access and refresh tokens
        setTokensLocally()
      }

      return res;
    }

    // if we get a 401 and we're not trying to refresh and this is our first retry
    if (res.status === 401 && path !== REFRESH_TOKEN_PATH && res.flighty.retryCount === 0) {
      try {
        await requestToRefreshYourToken();
        return await response.flighty.retry()
      } catch(e) {
        // log the user out
      }
    }

    return res;
  }
}

```
