# Flighty ✈️

[![NPM Version](https://img.shields.io/npm/v/flighty.svg?branch=master)](https://www.npmjs.com/package/flighty)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![dependencies Status](https://david-dm.org/akmjenkins/flighty/status.svg)](https://david-dm.org/akmjenkins/flighty)
[![install size](https://packagephobia.now.sh/badge?p=flighty&flightyCB=1)](https://packagephobia.now.sh/result?p=flighty)
[![codecov](https://codecov.io/gh/akmjenkins/flighty/branch/master/graph/badge.svg)](https://codecov.io/gh/akmjenkins/flighty)
[![Build Status](https://travis-ci.org/akmjenkins/flighty.svg?branch=master)](https://travis-ci.org/akmjenkins/flighty)

Simple (and tiny) fetch wrapper with nifty features such as intercepts, ***easy*** aborts, and retries, for everywhere - that's browser, react-native, and ES5/6 front-ends.

## Motivation

Yet another fetch wrapping library? Well, various fetch-wrapping libraries have some of the above features, but none have them all.

More importantly, almost all fetch wrapping libraries investigated include their polyfills right in the main packages (or don't include polyfills at all requiring you to find out what you're missing). Flighty has an opt-in polyfill for [fetch](https://www.npmjs.com/package/cross-fetch) (and tiny polyfills for [AbortController](https://www.npmjs.com/package/abortcontroller-polyfill) and [ES6 promise](https://github.com/taylorhakes/promise-polyfill), because you'll likely need those, too if you don't have fetch), so you don't have to bloat your code if you don't absolutely need to.

Everything you'll need is included in Flighty, it's just a matter of figuring out what you need. Running in a fetch-unknown environment - use flighty/fetch. You know you'll already have a fetch but unsure of AbortController? Use flighty/abort. Supporting the latest and greatest? Just import plain ol' flighty.

### Browser
```html
<!-- no polyfills -->
<script src="https://unpkg.com/flighty"></script>

<!-- fetch, abort, and promise polyfills -->
<script src="https://unpkg.com/flighty/fetch"></script>

<!-- abort only polyfill -->
<script src="https://unpkg.com/flighty/abort"></script>


<script>
 // no matter which package you choose
 var api = new Flighty({baseURI:'https://myapi.com'})
 api.get('/somepath').then(...)
</script>
```

### ES5
```js
// no polyfill
var Flighty = require('flighty');

// fetch, abort, and promise polyfills
var Flighty = require('flighty/fetch')

// abort only polyfill
var Flighty = require('flighty/abort');
```


### ES6 (and React Native*)
```js
// no polyfill
import Flighty from "Flighty";

// fetch, abort, and promise polyfills
import Flighty from "flighty/fetch";

// abort only polyfill
import Flighty from "flighty/abort";
```

**Note:** React Natives import from Flighty includes the AbortController polyfill. If React Native ever updates it's fetch, Flighty will remove this. If you do `import Flighty from "flighty/abort"` in React Native you'll get the same package as `import Flighty from "flighty"`, so it's recommended to do the latter.

## Tiny

Regardless of the package and implementation you choose, flighty is **tiny**. The biggest implementation (which is the browser build that has all polyfills) is *less than 9kb* minified and gzipped.

## Features

**Drop in replacement** for fetch. This works:

```js
const res = await fetch('/somepath',{some options});

const api = new Flighty({some options});
const res = await api.get('/somepath',{some options});
```

This works because Flighty returns the standard [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) but with the addition of the **flighty object**.

The drop in replacement makes this library relatively simple to add/remove from your codebase. If you keep your use of the flighty object on the response limited to interceptors then refactoring Flighty into/out of your codebase becomes a breeze.

### flighty object

```js
res.flighty = {
  method, // the method you called flighty with - e.g. get, post, put
  retryCount, // the number of times this request has been retried
  json, // what you'd normally get from await res.json()
  text, // what you'd normally get from await res.text()
  // the values the original flighty request was called with
  call: {
    path,
    options,
    extra
  },
  // retry method - calls the same request you made the first time again - hello JWT 401s
  retry: async ()
}

```

### Abort

Flighty comes with two abort APIs. `abortAll()` which cancels all ongoing requests and cancellation via an `abortToken` (similar to [axios cancellation token](https://github.com/axios/axios#cancellation) but easier!).

Aborting Fetch requests comes with a hairy, verbose [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) API that requires you to construct, pass in a signal to the fetch, and then abort the controller like so:

```js
  const controller = new AbortController();
  const req = fetch('/',{signal:controller.signal})

  controller.abort();

  try {
    const res = await req;
  } catch(err) {
    // AbortError!
  }

```

Flighty allows you to pass in a token (any Symbol) and then call `abort(token)` to cancel the request.

```js
  const req = flighty.get('/',{abortToken:"my token"});
  api.abort("my token");

  try {
    const res = await req;
  } catch(err) {
    // AbortError!
  }
```

Tokens, like AbortController signals, can be used to abort multiple requests. Let Flighty automate the creation and management of AbortController's for your requests. Just pass in a token and your request is then easy to abort.

```js
 const abortToken = "some token";
 const reqOne = flighty('/pathone',{abortToken})
 const reqTwo = flighty('/pathtwo',{abortToken})
 const reqThree = flighty('/paththree',{abortToken})

 // cancel them all!
 flighty.abort(abortToken);

```

### Interceptors

Drop in replacement for anybody using [Frisbee](https://www.npmjs.com/package/frisbee) interceptors or [fetch-intercept](https://www.npmjs.com/package/fetch-intercept), but with a couple of extra things:

```js
const interceptor = {
  request: (path,options,extra,retryCount) => {

    // extra is an immutable object of the data passed in when
    // creating the request - e.g. flighty('/mypath',{myFetchOptions},{someExtraData})
    // it doesn't get changed between interceptors if you modify it.

    // retryCount is the number of times this request has been
    // retried via res.flighty.retry() or by using the retry parameters
    // and is also immutable between interceptors


    return [path,options];
  }
}
```

Here's an example interceptor object:
```js
{
  request: function (path, options, extra, retryCount) {
      // remember - extra and retryCount are immutable and will
      // be passed to each interceptor the same
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
}
```

### Retries

Flighty implements the same retry parameters found in [fetch-retry](https://www.npmjs.com/package/fetch-retry) but it adds two important features:

1) Doesn't continue to retry if the request was aborted via an AbortController signal (or token)
2) Adds an optional asynchronous `retryFn` that will be executed between retries

#### Retry API

* `retries` - the maximum number of retries to perform on a fetch (default 0 - do not retry)

* `*retryDelay` - a timeout in ms to wait between retries (default 1000ms)

* `retryOn` - an array of HTTP status codes that you want to retry (default you only retry if there was a network error)

* `*retryFn` - a function that gets called in between the failure and the retry. This function is `await`ed so you can do some asynchronous work before the retry. Combine this with retryOn:[401] and you've got yourself a(nother) recipe to refresh JWTs (more at the end of this README):

***Note:** The `retryDelay` parameter will be ignored if `retryFn` is declared. If you're using `retryFn` it's up to you to handle the delay, if any, between retries.

```js
res = await api.get('/path-requiring-authentication',{
  retries:1,
  retryOn:[401],
  retryFn:() => api.get('/path_to_refresh_you_token')
})
```

The Flighty object also has a retry method to make it simply to retry a request:

```js
  let res;
  const api = new Flighty();
  res = await api.get('/');

  if(!res.ok && res.flighty.retryCount === 0) {
    // try it one more time...
    res = res.flighty.retry();
  }
```

---

## API

* `Flighty` - accepts an `options` object, with the following accepted options:

  * `baseURI` - the default URI use to prefix all your paths

  * `headers` - an object containing default headers to send with every request

  * `arrayFormat` - how to stringify array in passed body. See [qs](https://www.npmjs.com/package/qs) for available formats

Upon being invoked, `Flighty` has the following methods

* `jwt(token)` - Set your Bearer Authorization header via this method. Pass in a token and Flighty will add the header for you, pass in something false-y and Flighty won't automatically add an auth header (in case you want to do it yourself)

* `auth(username,password)` - Set your Basic Authorization header via this method. Pass in a username and password and Flighty will add the header `Authorization Basic bas64encoded username and password` for you, pass in something false-y and Flighty won't automatically add an auth header (in case you want to do it yourself)

* `abort` - method that accepts an abortToken to abort specific requests.

* `abortAll` - aborts all in-progress requests controlled by this instance.

* HTTP wrapper methods (e.g. get, post, put, delete, etc) require a `path` string, and accept two optional plain object arguments - `options` and `extra`

  * Accepted method arguments:

    * `path` **required** - the path for the HTTP request (e.g. `/v1/login`, will be prefixed with the value of `baseURI` if set)

    * `options` _optional_ - everything you'd pass into fetch's [init](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) plus optional `abortToken` and retry parameters: `retries`,`retryFn`,`retryDelay`,`retryFn`

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

## Unit testing

Keep it short - don't mock Flighty. It'd be over-complicated and unnecessary to mock it's features - so just mock the fetch and let Flighty do it's thing in your tests. I recommend [jest-fetch-mock](https://www.npmjs.com/package/jest-fetch-mock).

---

## Recipes

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
  response:res => {
    if(!res.ok) {
      throw res;
    }
    return res;
  }
});

// Now all my responses throw if I get a non-2xx response
try {
  const res = await api.get('/');
} catch(e) {
  // response returned non-2xx
}
```

### JWT Recipe with retry() and Interceptors

```js
const api = new Flighty();

const interceptor = {
  request: (path,options) => {
    api.jwt(path === REFRESH_ENDPOINT ? myRefreshToken : myAccessToken);
    return [path,options]
  },
  response: async res => {

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
        return response.flighty.retry()
      } catch(e) {
        // log the user out
      }
    }

    return res;
  }
}

```

### Alternate JWT Recipe and Interceptors
```js
const api = new Flighty();

// same request interceptor as before
const interceptor = {
  request:(path,options) => {
    api.jwt(path === REFRESH_ENDPOINT ? myRefreshToken : myAccessToken);
    return [path,options]
  }
}

const authenticatedApiRequest = (path,options,extra) => {
  return api(
    path,
    {
      ...options,
      // retry the request 1 time
      retries:1,
      // if a 401 or network error is received
      retryOn:[401],
      // and request a new token in between
      retryFn:() => api.get(REFRESH_TOKEN_ENDPOINT)
    }
    extra)
};

const myRequest = authenticatedApiRequest('/some-path-requiring-authentication');
```

## Contributing

PRs and ideas welcome!