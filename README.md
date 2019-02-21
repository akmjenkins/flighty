# Flighty

[![codecov](https://codecov.io/gh/akmjenkins/flighty/branch/master/graph/badge.svg)](https://codecov.io/gh/akmjenkins/flighty) [![Build Status](https://travis-ci.org/akmjenkins/flighty.svg?branch=master)](https://travis-ci.org/akmjenkins/flighty)

Simple (and tiny) fetch wrapper with easy aborts (and retries!) for everywhere.

## Motivation

WHY? The main inspiration was creating a library that was **BYOF** - Bring your own fetch. Frisbee is an amazing library, but with the vast majority of environments nowadays support fetch, so including a full fetch implementation (via cross-fetch) in the build is largely unnecessary.

Flighty weighs a hefty 5.4kb minified and gzipped with included dependencies [qs](https://www.npmjs.com/package/qs) and [url-join](https://www.npmjs.com/package/url-join) (doesn't include fetch!)

If you want to polyfill fetch it'll cost you bigly - an extra 2.5kb minified and gzipped.

## Features

### Easy Abort

### Interceptors

### Retries
