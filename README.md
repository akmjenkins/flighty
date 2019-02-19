# Flighty

[![codecov](https://codecov.io/gh/akmjenkins/flighty/branch/master/graph/badge.svg)](https://codecov.io/gh/akmjenkins/flighty) [![Build Status](https://travis-ci.org/akmjenkins/flighty.svg?branch=master)](https://travis-ci.org/akmjenkins/flighty)

Simple fetch wrapper with easy aborts for node/front-ends.

## Motivation

WHY? The main inspiration was creating a library that was **BYOF** - Bring your own fetch. Frisbee is an amazing library, but with the vast majority of environments nowadays support fetch, so including a full fetch implementation (via cross-fetch) in the build is largely unnecessary.

The CommonJS size of the flighty library weighs a hefty 13kB with included dependencies [qs](https://www.npmjs.com/package/qs), [caseless](https://www.npmjs.com/package/caseless), and [url-join](https://www.npmjs.com/package/url-join)

If you're going to be operating in an unknown environment (i.e. supporting legacy browsers), add cross-fetch and include the polyfill

```
yarn add cross-fetch

// in your code base
require('cross-fetch/polyfill');
```

### Testing

The interceptors in this library (modeled after Frisbee and probably originally from [angular's http service](https://angular.io/api/common/http/HttpInterceptor)) are neat, so when you're writing unit tests, instead of mocking this library, you should mock the only part you actually need to - the fetch (might I recommend [jest-fetch-mock](https://www.npmjs.com/package/jest-fetch-mock)?)
