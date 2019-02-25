'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Stream = _interopDefault(require('stream'));
var http = _interopDefault(require('http'));
var Url = _interopDefault(require('url'));
var https = _interopDefault(require('https'));
var zlib = _interopDefault(require('zlib'));
var qs = _interopDefault(require('qs'));
var urlJoin = _interopDefault(require('url-join'));

/**
 * @this {Promise}
 */

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

function getCjsExportFromNamespace (n) {
	return n && n.default || n;
}

// (MIT licensed)

const BUFFER = Symbol('buffer');
const TYPE = Symbol('type');

class Blob {
  constructor() {
    this[TYPE] = '';
    const blobParts = arguments[0];
    const options = arguments[1];
    const buffers = [];

    if (blobParts) {
      const a = blobParts;
      const length = Number(a.length);

      for (let i = 0; i < length; i++) {
        const element = a[i];
        let buffer;

        if (element instanceof Buffer) {
          buffer = element;
        } else if (ArrayBuffer.isView(element)) {
          buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
        } else if (element instanceof ArrayBuffer) {
          buffer = Buffer.from(element);
        } else if (element instanceof Blob) {
          buffer = element[BUFFER];
        } else {
          buffer = Buffer.from(typeof element === 'string' ? element : String(element));
        }

        buffers.push(buffer);
      }
    }

    this[BUFFER] = Buffer.concat(buffers);
    let type = options && options.type !== undefined && String(options.type).toLowerCase();

    if (type && !/[^\u0020-\u007E]/.test(type)) {
      this[TYPE] = type;
    }
  }

  get size() {
    return this[BUFFER].length;
  }

  get type() {
    return this[TYPE];
  }

  slice() {
    const size = this.size;
    const start = arguments[0];
    const end = arguments[1];
    let relativeStart, relativeEnd;

    if (start === undefined) {
      relativeStart = 0;
    } else if (start < 0) {
      relativeStart = Math.max(size + start, 0);
    } else {
      relativeStart = Math.min(start, size);
    }

    if (end === undefined) {
      relativeEnd = size;
    } else if (end < 0) {
      relativeEnd = Math.max(size + end, 0);
    } else {
      relativeEnd = Math.min(end, size);
    }

    const span = Math.max(relativeEnd - relativeStart, 0);
    const buffer = this[BUFFER];
    const slicedBuffer = buffer.slice(relativeStart, relativeStart + span);
    const blob = new Blob([], {
      type: arguments[2]
    });
    blob[BUFFER] = slicedBuffer;
    return blob;
  }

}

Object.defineProperties(Blob.prototype, {
  size: {
    enumerable: true
  },
  type: {
    enumerable: true
  },
  slice: {
    enumerable: true
  }
});
Object.defineProperty(Blob.prototype, Symbol.toStringTag, {
  value: 'Blob',
  writable: false,
  enumerable: false,
  configurable: true
});
/**
 * fetch-error.js
 *
 * FetchError interface for operational errors
 */

/**
 * Create FetchError instance
 *
 * @param   String      message      Error message for human
 * @param   String      type         Error type for machine
 * @param   String      systemError  For Node.js system error
 * @return  FetchError
 */

function FetchError(message, type, systemError) {
  Error.call(this, message);
  this.message = message;
  this.type = type; // when err.type is `system`, err.code contains system error code

  if (systemError) {
    this.code = this.errno = systemError.code;
  } // hide custom error implementation details from end-users


  Error.captureStackTrace(this, this.constructor);
}

FetchError.prototype = Object.create(Error.prototype);
FetchError.prototype.constructor = FetchError;
FetchError.prototype.name = 'FetchError';
let convert;

try {
  convert = require('encoding').convert;
} catch (e) {}

const INTERNALS = Symbol('Body internals'); // fix an issue where "PassThrough" isn't a named export for node <10

const PassThrough = Stream.PassThrough;
/**
 * Body mixin
 *
 * Ref: https://fetch.spec.whatwg.org/#body
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */

function Body(body) {
  var _this = this;

  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref$size = _ref.size;

  let size = _ref$size === undefined ? 0 : _ref$size;
  var _ref$timeout = _ref.timeout;
  let timeout = _ref$timeout === undefined ? 0 : _ref$timeout;

  if (body == null) {
    // body is undefined or null
    body = null;
  } else if (typeof body === 'string') ;else if (isURLSearchParams(body)) ;else if (body instanceof Blob) ;else if (Buffer.isBuffer(body)) ;else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') ;else if (ArrayBuffer.isView(body)) ;else if (body instanceof Stream) ;else {
    // none of the above
    // coerce to string
    body = String(body);
  }

  this[INTERNALS] = {
    body,
    disturbed: false,
    error: null
  };
  this.size = size;
  this.timeout = timeout;

  if (body instanceof Stream) {
    body.on('error', function (err) {
      const error = err.name === 'AbortError' ? err : new FetchError(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`, 'system', err);
      _this[INTERNALS].error = error;
    });
  }
}

Body.prototype = {
  get body() {
    return this[INTERNALS].body;
  },

  get bodyUsed() {
    return this[INTERNALS].disturbed;
  },

  /**
   * Decode response as ArrayBuffer
   *
   * @return  Promise
   */
  arrayBuffer() {
    return consumeBody.call(this).then(function (buf) {
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    });
  },

  /**
   * Return raw response as Blob
   *
   * @return Promise
   */
  blob() {
    let ct = this.headers && this.headers.get('content-type') || '';
    return consumeBody.call(this).then(function (buf) {
      return Object.assign( // Prevent copying
      new Blob([], {
        type: ct.toLowerCase()
      }), {
        [BUFFER]: buf
      });
    });
  },

  /**
   * Decode response as json
   *
   * @return  Promise
   */
  json() {
    var _this2 = this;

    return consumeBody.call(this).then(function (buffer) {
      try {
        return JSON.parse(buffer.toString());
      } catch (err) {
        return Body.Promise.reject(new FetchError(`invalid json response body at ${_this2.url} reason: ${err.message}`, 'invalid-json'));
      }
    });
  },

  /**
   * Decode response as text
   *
   * @return  Promise
   */
  text() {
    return consumeBody.call(this).then(function (buffer) {
      return buffer.toString();
    });
  },

  /**
   * Decode response as buffer (non-spec api)
   *
   * @return  Promise
   */
  buffer() {
    return consumeBody.call(this);
  },

  /**
   * Decode response as text, while automatically detecting the encoding and
   * trying to decode to UTF-8 (non-spec api)
   *
   * @return  Promise
   */
  textConverted() {
    var _this3 = this;

    return consumeBody.call(this).then(function (buffer) {
      return convertBody(buffer, _this3.headers);
    });
  }

}; // In browsers, all properties are enumerable.

Object.defineProperties(Body.prototype, {
  body: {
    enumerable: true
  },
  bodyUsed: {
    enumerable: true
  },
  arrayBuffer: {
    enumerable: true
  },
  blob: {
    enumerable: true
  },
  json: {
    enumerable: true
  },
  text: {
    enumerable: true
  }
});

Body.mixIn = function (proto) {
  for (const name of Object.getOwnPropertyNames(Body.prototype)) {
    // istanbul ignore else: future proof
    if (!(name in proto)) {
      const desc = Object.getOwnPropertyDescriptor(Body.prototype, name);
      Object.defineProperty(proto, name, desc);
    }
  }
};
/**
 * Consume and convert an entire Body to a Buffer.
 *
 * Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
 *
 * @return  Promise
 */


function consumeBody() {
  var _this4 = this;

  if (this[INTERNALS].disturbed) {
    return Body.Promise.reject(new TypeError(`body used already for: ${this.url}`));
  }

  this[INTERNALS].disturbed = true;

  if (this[INTERNALS].error) {
    return Body.Promise.reject(this[INTERNALS].error);
  } // body is null


  if (this.body === null) {
    return Body.Promise.resolve(Buffer.alloc(0));
  } // body is string


  if (typeof this.body === 'string') {
    return Body.Promise.resolve(Buffer.from(this.body));
  } // body is blob


  if (this.body instanceof Blob) {
    return Body.Promise.resolve(this.body[BUFFER]);
  } // body is buffer


  if (Buffer.isBuffer(this.body)) {
    return Body.Promise.resolve(this.body);
  } // body is ArrayBuffer


  if (Object.prototype.toString.call(this.body) === '[object ArrayBuffer]') {
    return Body.Promise.resolve(Buffer.from(this.body));
  } // body is ArrayBufferView


  if (ArrayBuffer.isView(this.body)) {
    return Body.Promise.resolve(Buffer.from(this.body.buffer, this.body.byteOffset, this.body.byteLength));
  } // istanbul ignore if: should never happen


  if (!(this.body instanceof Stream)) {
    return Body.Promise.resolve(Buffer.alloc(0));
  } // body is stream
  // get ready to actually consume the body


  let accum = [];
  let accumBytes = 0;
  let abort = false;
  return new Body.Promise(function (resolve, reject) {
    let resTimeout; // allow timeout on slow response body

    if (_this4.timeout) {
      resTimeout = setTimeout(function () {
        abort = true;
        reject(new FetchError(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`, 'body-timeout'));
      }, _this4.timeout);
    } // handle stream errors


    _this4.body.on('error', function (err) {
      if (err.name === 'AbortError') {
        // if the request was aborted, reject with this Error
        abort = true;
        reject(err);
      } else {
        // other errors, such as incorrect content-encoding
        reject(new FetchError(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`, 'system', err));
      }
    });

    _this4.body.on('data', function (chunk) {
      if (abort || chunk === null) {
        return;
      }

      if (_this4.size && accumBytes + chunk.length > _this4.size) {
        abort = true;
        reject(new FetchError(`content size at ${_this4.url} over limit: ${_this4.size}`, 'max-size'));
        return;
      }

      accumBytes += chunk.length;
      accum.push(chunk);
    });

    _this4.body.on('end', function () {
      if (abort) {
        return;
      }

      clearTimeout(resTimeout);

      try {
        resolve(Buffer.concat(accum));
      } catch (err) {
        // handle streams that have accumulated too much data (issue #414)
        reject(new FetchError(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`, 'system', err));
      }
    });
  });
}
/**
 * Detect buffer encoding and convert to target encoding
 * ref: http://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#determining-the-character-encoding
 *
 * @param   Buffer  buffer    Incoming buffer
 * @param   String  encoding  Target encoding
 * @return  String
 */


function convertBody(buffer, headers) {
  if (typeof convert !== 'function') {
    throw new Error('The package `encoding` must be installed to use the textConverted() function');
  }

  const ct = headers.get('content-type');
  let charset = 'utf-8';
  let res, str; // header

  if (ct) {
    res = /charset=([^;]*)/i.exec(ct);
  } // no charset in content type, peek at response body for at most 1024 bytes


  str = buffer.slice(0, 1024).toString(); // html5

  if (!res && str) {
    res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
  } // html4


  if (!res && str) {
    res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str);

    if (res) {
      res = /charset=(.*)/i.exec(res.pop());
    }
  } // xml


  if (!res && str) {
    res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
  } // found charset


  if (res) {
    charset = res.pop(); // prevent decode issues when sites use incorrect encoding
    // ref: https://hsivonen.fi/encoding-menu/

    if (charset === 'gb2312' || charset === 'gbk') {
      charset = 'gb18030';
    }
  } // turn raw buffers into a single utf-8 buffer


  return convert(buffer, 'UTF-8', charset).toString();
}
/**
 * Detect a URLSearchParams object
 * ref: https://github.com/bitinn/node-fetch/issues/296#issuecomment-307598143
 *
 * @param   Object  obj     Object to detect by type or brand
 * @return  String
 */


function isURLSearchParams(obj) {
  // Duck-typing as a necessary condition.
  if (typeof obj !== 'object' || typeof obj.append !== 'function' || typeof obj.delete !== 'function' || typeof obj.get !== 'function' || typeof obj.getAll !== 'function' || typeof obj.has !== 'function' || typeof obj.set !== 'function') {
    return false;
  } // Brand-checking and more duck-typing as optional condition.


  return obj.constructor.name === 'URLSearchParams' || Object.prototype.toString.call(obj) === '[object URLSearchParams]' || typeof obj.sort === 'function';
}
/**
 * Clone body given Res/Req instance
 *
 * @param   Mixed  instance  Response or Request instance
 * @return  Mixed
 */


function clone(instance) {
  let p1, p2;
  let body = instance.body; // don't allow cloning a used body

  if (instance.bodyUsed) {
    throw new Error('cannot clone body after it is used');
  } // check that body is a stream and not form-data object
  // note: we can't clone the form-data object without having it as a dependency


  if (body instanceof Stream && typeof body.getBoundary !== 'function') {
    // tee instance body
    p1 = new PassThrough();
    p2 = new PassThrough();
    body.pipe(p1);
    body.pipe(p2); // set instance body to teed body and return the other teed body

    instance[INTERNALS].body = p1;
    body = p2;
  }

  return body;
}
/**
 * Performs the operation "extract a `Content-Type` value from |object|" as
 * specified in the specification:
 * https://fetch.spec.whatwg.org/#concept-bodyinit-extract
 *
 * This function assumes that instance.body is present.
 *
 * @param   Mixed  instance  Response or Request instance
 */


function extractContentType(instance) {
  const body = instance.body; // istanbul ignore if: Currently, because of a guard in Request, body
  // can never be null. Included here for completeness.

  if (body === null) {
    // body is null
    return null;
  } else if (typeof body === 'string') {
    // body is string
    return 'text/plain;charset=UTF-8';
  } else if (isURLSearchParams(body)) {
    // body is a URLSearchParams
    return 'application/x-www-form-urlencoded;charset=UTF-8';
  } else if (body instanceof Blob) {
    // body is blob
    return body.type || null;
  } else if (Buffer.isBuffer(body)) {
    // body is buffer
    return null;
  } else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
    // body is ArrayBuffer
    return null;
  } else if (ArrayBuffer.isView(body)) {
    // body is ArrayBufferView
    return null;
  } else if (typeof body.getBoundary === 'function') {
    // detect form data input from form-data module
    return `multipart/form-data;boundary=${body.getBoundary()}`;
  } else {
    // body is stream
    // can't really do much about this
    return null;
  }
}
/**
 * The Fetch Standard treats this as if "total bytes" is a property on the body.
 * For us, we have to explicitly get it with a function.
 *
 * ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
 *
 * @param   Body    instance   Instance of Body
 * @return  Number?            Number of bytes, or null if not possible
 */


function getTotalBytes(instance) {
  const body = instance.body; // istanbul ignore if: included for completion

  if (body === null) {
    // body is null
    return 0;
  } else if (typeof body === 'string') {
    // body is string
    return Buffer.byteLength(body);
  } else if (isURLSearchParams(body)) {
    // body is URLSearchParams
    return Buffer.byteLength(String(body));
  } else if (body instanceof Blob) {
    // body is blob
    return body.size;
  } else if (Buffer.isBuffer(body)) {
    // body is buffer
    return body.length;
  } else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
    // body is ArrayBuffer
    return body.byteLength;
  } else if (ArrayBuffer.isView(body)) {
    // body is ArrayBufferView
    return body.byteLength;
  } else if (body && typeof body.getLengthSync === 'function') {
    // detect form data input from form-data module
    if (body._lengthRetrievers && body._lengthRetrievers.length == 0 || // 1.x
    body.hasKnownLength && body.hasKnownLength()) {
      // 2.x
      return body.getLengthSync();
    }

    return null;
  } else {
    // body is stream
    // can't really do much about this
    return null;
  }
}
/**
 * Write a Body to a Node.js WritableStream (e.g. http.Request) object.
 *
 * @param   Body    instance   Instance of Body
 * @return  Void
 */


function writeToStream(dest, instance) {
  const body = instance.body;

  if (body === null) {
    // body is null
    dest.end();
  } else if (typeof body === 'string') {
    // body is string
    dest.write(body);
    dest.end();
  } else if (isURLSearchParams(body)) {
    // body is URLSearchParams
    dest.write(Buffer.from(String(body)));
    dest.end();
  } else if (body instanceof Blob) {
    // body is blob
    dest.write(body[BUFFER]);
    dest.end();
  } else if (Buffer.isBuffer(body)) {
    // body is buffer
    dest.write(body);
    dest.end();
  } else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
    // body is ArrayBuffer
    dest.write(Buffer.from(body));
    dest.end();
  } else if (ArrayBuffer.isView(body)) {
    // body is ArrayBufferView
    dest.write(Buffer.from(body.buffer, body.byteOffset, body.byteLength));
    dest.end();
  } else {
    // body is stream
    body.pipe(dest);
  }
} // expose Promise


Body.Promise = global.Promise;
/**
 * headers.js
 *
 * Headers class offers convenient helpers
 */

const invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;

function validateName(name) {
  name = `${name}`;

  if (invalidTokenRegex.test(name)) {
    throw new TypeError(`${name} is not a legal HTTP header name`);
  }
}

function validateValue(value) {
  value = `${value}`;

  if (invalidHeaderCharRegex.test(value)) {
    throw new TypeError(`${value} is not a legal HTTP header value`);
  }
}
/**
 * Find the key in the map object given a header name.
 *
 * Returns undefined if not found.
 *
 * @param   String  name  Header name
 * @return  String|Undefined
 */


function find(map, name) {
  name = name.toLowerCase();

  for (const key in map) {
    if (key.toLowerCase() === name) {
      return key;
    }
  }

  return undefined;
}

const MAP = Symbol('map');

class Headers {
  /**
   * Headers class
   *
   * @param   Object  headers  Response headers
   * @return  Void
   */
  constructor() {
    let init = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;
    this[MAP] = Object.create(null);

    if (init instanceof Headers) {
      const rawHeaders = init.raw();
      const headerNames = Object.keys(rawHeaders);

      for (const headerName of headerNames) {
        for (const value of rawHeaders[headerName]) {
          this.append(headerName, value);
        }
      }

      return;
    } // We don't worry about converting prop to ByteString here as append()
    // will handle it.


    if (init == null) ;else if (typeof init === 'object') {
      const method = init[Symbol.iterator];

      if (method != null) {
        if (typeof method !== 'function') {
          throw new TypeError('Header pairs must be iterable');
        } // sequence<sequence<ByteString>>
        // Note: per spec we have to first exhaust the lists then process them


        const pairs = [];

        for (const pair of init) {
          if (typeof pair !== 'object' || typeof pair[Symbol.iterator] !== 'function') {
            throw new TypeError('Each header pair must be iterable');
          }

          pairs.push(Array.from(pair));
        }

        for (const pair of pairs) {
          if (pair.length !== 2) {
            throw new TypeError('Each header pair must be a name/value tuple');
          }

          this.append(pair[0], pair[1]);
        }
      } else {
        // record<ByteString, ByteString>
        for (const key of Object.keys(init)) {
          const value = init[key];
          this.append(key, value);
        }
      }
    } else {
      throw new TypeError('Provided initializer must be an object');
    }
  }
  /**
   * Return combined header value given name
   *
   * @param   String  name  Header name
   * @return  Mixed
   */


  get(name) {
    name = `${name}`;
    validateName(name);
    const key = find(this[MAP], name);

    if (key === undefined) {
      return null;
    }

    return this[MAP][key].join(', ');
  }
  /**
   * Iterate over all headers
   *
   * @param   Function  callback  Executed for each item with parameters (value, name, thisArg)
   * @param   Boolean   thisArg   `this` context for callback function
   * @return  Void
   */


  forEach(callback) {
    let thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
    let pairs = getHeaders(this);
    let i = 0;

    while (i < pairs.length) {
      var _pairs$i = pairs[i];
      const name = _pairs$i[0],
            value = _pairs$i[1];
      callback.call(thisArg, value, name, this);
      pairs = getHeaders(this);
      i++;
    }
  }
  /**
   * Overwrite header values given name
   *
   * @param   String  name   Header name
   * @param   String  value  Header value
   * @return  Void
   */


  set(name, value) {
    name = `${name}`;
    value = `${value}`;
    validateName(name);
    validateValue(value);
    const key = find(this[MAP], name);
    this[MAP][key !== undefined ? key : name] = [value];
  }
  /**
   * Append a value onto existing header
   *
   * @param   String  name   Header name
   * @param   String  value  Header value
   * @return  Void
   */


  append(name, value) {
    name = `${name}`;
    value = `${value}`;
    validateName(name);
    validateValue(value);
    const key = find(this[MAP], name);

    if (key !== undefined) {
      this[MAP][key].push(value);
    } else {
      this[MAP][name] = [value];
    }
  }
  /**
   * Check for header name existence
   *
   * @param   String   name  Header name
   * @return  Boolean
   */


  has(name) {
    name = `${name}`;
    validateName(name);
    return find(this[MAP], name) !== undefined;
  }
  /**
   * Delete all header values given name
   *
   * @param   String  name  Header name
   * @return  Void
   */


  delete(name) {
    name = `${name}`;
    validateName(name);
    const key = find(this[MAP], name);

    if (key !== undefined) {
      delete this[MAP][key];
    }
  }
  /**
   * Return raw headers (non-spec api)
   *
   * @return  Object
   */


  raw() {
    return this[MAP];
  }
  /**
   * Get an iterator on keys.
   *
   * @return  Iterator
   */


  keys() {
    return createHeadersIterator(this, 'key');
  }
  /**
   * Get an iterator on values.
   *
   * @return  Iterator
   */


  values() {
    return createHeadersIterator(this, 'value');
  }
  /**
   * Get an iterator on entries.
   *
   * This is the default iterator of the Headers object.
   *
   * @return  Iterator
   */


  [Symbol.iterator]() {
    return createHeadersIterator(this, 'key+value');
  }

}

Headers.prototype.entries = Headers.prototype[Symbol.iterator];
Object.defineProperty(Headers.prototype, Symbol.toStringTag, {
  value: 'Headers',
  writable: false,
  enumerable: false,
  configurable: true
});
Object.defineProperties(Headers.prototype, {
  get: {
    enumerable: true
  },
  forEach: {
    enumerable: true
  },
  set: {
    enumerable: true
  },
  append: {
    enumerable: true
  },
  has: {
    enumerable: true
  },
  delete: {
    enumerable: true
  },
  keys: {
    enumerable: true
  },
  values: {
    enumerable: true
  },
  entries: {
    enumerable: true
  }
});

function getHeaders(headers) {
  let kind = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'key+value';
  const keys = Object.keys(headers[MAP]).sort();
  return keys.map(kind === 'key' ? function (k) {
    return k.toLowerCase();
  } : kind === 'value' ? function (k) {
    return headers[MAP][k].join(', ');
  } : function (k) {
    return [k.toLowerCase(), headers[MAP][k].join(', ')];
  });
}

const INTERNAL = Symbol('internal');

function createHeadersIterator(target, kind) {
  const iterator = Object.create(HeadersIteratorPrototype);
  iterator[INTERNAL] = {
    target,
    kind,
    index: 0
  };
  return iterator;
}

const HeadersIteratorPrototype = Object.setPrototypeOf({
  next() {
    // istanbul ignore if
    if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype) {
      throw new TypeError('Value of `this` is not a HeadersIterator');
    }

    var _INTERNAL = this[INTERNAL];
    const target = _INTERNAL.target,
          kind = _INTERNAL.kind,
          index = _INTERNAL.index;
    const values = getHeaders(target, kind);
    const len = values.length;

    if (index >= len) {
      return {
        value: undefined,
        done: true
      };
    }

    this[INTERNAL].index = index + 1;
    return {
      value: values[index],
      done: false
    };
  }

}, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));
Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
  value: 'HeadersIterator',
  writable: false,
  enumerable: false,
  configurable: true
});
/**
 * Export the Headers object in a form that Node.js can consume.
 *
 * @param   Headers  headers
 * @return  Object
 */

function exportNodeCompatibleHeaders(headers) {
  const obj = Object.assign({
    __proto__: null
  }, headers[MAP]); // http.request() only supports string as Host header. This hack makes
  // specifying custom Host header possible.

  const hostHeaderKey = find(headers[MAP], 'Host');

  if (hostHeaderKey !== undefined) {
    obj[hostHeaderKey] = obj[hostHeaderKey][0];
  }

  return obj;
}
/**
 * Create a Headers object from an object of headers, ignoring those that do
 * not conform to HTTP grammar productions.
 *
 * @param   Object  obj  Object of headers
 * @return  Headers
 */


function createHeadersLenient(obj) {
  const headers = new Headers();

  for (const name of Object.keys(obj)) {
    if (invalidTokenRegex.test(name)) {
      continue;
    }

    if (Array.isArray(obj[name])) {
      for (const val of obj[name]) {
        if (invalidHeaderCharRegex.test(val)) {
          continue;
        }

        if (headers[MAP][name] === undefined) {
          headers[MAP][name] = [val];
        } else {
          headers[MAP][name].push(val);
        }
      }
    } else if (!invalidHeaderCharRegex.test(obj[name])) {
      headers[MAP][name] = [obj[name]];
    }
  }

  return headers;
}

const INTERNALS$1 = Symbol('Response internals'); // fix an issue where "STATUS_CODES" aren't a named export for node <10

const STATUS_CODES = http.STATUS_CODES;
/**
 * Response class
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */

class Response {
  constructor() {
    let body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    Body.call(this, body, opts);
    const status = opts.status || 200;
    this[INTERNALS$1] = {
      url: opts.url,
      status,
      statusText: opts.statusText || STATUS_CODES[status],
      headers: new Headers(opts.headers)
    };
  }

  get url() {
    return this[INTERNALS$1].url;
  }

  get status() {
    return this[INTERNALS$1].status;
  }
  /**
   * Convenience property representing if the request ended normally
   */


  get ok() {
    return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
  }

  get statusText() {
    return this[INTERNALS$1].statusText;
  }

  get headers() {
    return this[INTERNALS$1].headers;
  }
  /**
   * Clone this response
   *
   * @return  Response
   */


  clone() {
    return new Response(clone(this), {
      url: this.url,
      status: this.status,
      statusText: this.statusText,
      headers: this.headers,
      ok: this.ok
    });
  }

}

Body.mixIn(Response.prototype);
Object.defineProperties(Response.prototype, {
  url: {
    enumerable: true
  },
  status: {
    enumerable: true
  },
  ok: {
    enumerable: true
  },
  statusText: {
    enumerable: true
  },
  headers: {
    enumerable: true
  },
  clone: {
    enumerable: true
  }
});
Object.defineProperty(Response.prototype, Symbol.toStringTag, {
  value: 'Response',
  writable: false,
  enumerable: false,
  configurable: true
});
const INTERNALS$2 = Symbol('Request internals'); // fix an issue where "format", "parse" aren't a named export for node <10

const parse_url = Url.parse;
const format_url = Url.format;
const streamDestructionSupported = 'destroy' in Stream.Readable.prototype;
/**
 * Check if a value is an instance of Request.
 *
 * @param   Mixed   input
 * @return  Boolean
 */

function isRequest(input) {
  return typeof input === 'object' && typeof input[INTERNALS$2] === 'object';
}

function isAbortSignal(signal) {
  const proto = signal && typeof signal === 'object' && Object.getPrototypeOf(signal);
  return !!(proto && proto.constructor.name === 'AbortSignal');
}
/**
 * Request class
 *
 * @param   Mixed   input  Url or Request instance
 * @param   Object  init   Custom options
 * @return  Void
 */


class Request {
  constructor(input) {
    let init = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    let parsedURL; // normalize input

    if (!isRequest(input)) {
      if (input && input.href) {
        // in order to support Node.js' Url objects; though WHATWG's URL objects
        // will fall into this branch also (since their `toString()` will return
        // `href` property anyway)
        parsedURL = parse_url(input.href);
      } else {
        // coerce input to a string before attempting to parse
        parsedURL = parse_url(`${input}`);
      }

      input = {};
    } else {
      parsedURL = parse_url(input.url);
    }

    let method = init.method || input.method || 'GET';
    method = method.toUpperCase();

    if ((init.body != null || isRequest(input) && input.body !== null) && (method === 'GET' || method === 'HEAD')) {
      throw new TypeError('Request with GET/HEAD method cannot have body');
    }

    let inputBody = init.body != null ? init.body : isRequest(input) && input.body !== null ? clone(input) : null;
    Body.call(this, inputBody, {
      timeout: init.timeout || input.timeout || 0,
      size: init.size || input.size || 0
    });
    const headers = new Headers(init.headers || input.headers || {});

    if (init.body != null) {
      const contentType = extractContentType(this);

      if (contentType !== null && !headers.has('Content-Type')) {
        headers.append('Content-Type', contentType);
      }
    }

    let signal = isRequest(input) ? input.signal : null;
    if ('signal' in init) signal = init.signal;

    if (signal != null && !isAbortSignal(signal)) {
      throw new TypeError('Expected signal to be an instanceof AbortSignal');
    }

    this[INTERNALS$2] = {
      method,
      redirect: init.redirect || input.redirect || 'follow',
      headers,
      parsedURL,
      signal
    }; // node-fetch-only options

    this.follow = init.follow !== undefined ? init.follow : input.follow !== undefined ? input.follow : 20;
    this.compress = init.compress !== undefined ? init.compress : input.compress !== undefined ? input.compress : true;
    this.counter = init.counter || input.counter || 0;
    this.agent = init.agent || input.agent;
  }

  get method() {
    return this[INTERNALS$2].method;
  }

  get url() {
    return format_url(this[INTERNALS$2].parsedURL);
  }

  get headers() {
    return this[INTERNALS$2].headers;
  }

  get redirect() {
    return this[INTERNALS$2].redirect;
  }

  get signal() {
    return this[INTERNALS$2].signal;
  }
  /**
   * Clone this request
   *
   * @return  Request
   */


  clone() {
    return new Request(this);
  }

}

Body.mixIn(Request.prototype);
Object.defineProperty(Request.prototype, Symbol.toStringTag, {
  value: 'Request',
  writable: false,
  enumerable: false,
  configurable: true
});
Object.defineProperties(Request.prototype, {
  method: {
    enumerable: true
  },
  url: {
    enumerable: true
  },
  headers: {
    enumerable: true
  },
  redirect: {
    enumerable: true
  },
  clone: {
    enumerable: true
  },
  signal: {
    enumerable: true
  }
});
/**
 * Convert a Request to Node.js http request options.
 *
 * @param   Request  A Request instance
 * @return  Object   The options object to be passed to http.request
 */

function getNodeRequestOptions(request) {
  const parsedURL = request[INTERNALS$2].parsedURL;
  const headers = new Headers(request[INTERNALS$2].headers); // fetch step 1.3

  if (!headers.has('Accept')) {
    headers.set('Accept', '*/*');
  } // Basic fetch


  if (!parsedURL.protocol || !parsedURL.hostname) {
    throw new TypeError('Only absolute URLs are supported');
  }

  if (!/^https?:$/.test(parsedURL.protocol)) {
    throw new TypeError('Only HTTP(S) protocols are supported');
  }

  if (request.signal && request.body instanceof Stream.Readable && !streamDestructionSupported) {
    throw new Error('Cancellation of streamed requests with AbortSignal is not supported in node < 8');
  } // HTTP-network-or-cache fetch steps 2.4-2.7


  let contentLengthValue = null;

  if (request.body == null && /^(POST|PUT)$/i.test(request.method)) {
    contentLengthValue = '0';
  }

  if (request.body != null) {
    const totalBytes = getTotalBytes(request);

    if (typeof totalBytes === 'number') {
      contentLengthValue = String(totalBytes);
    }
  }

  if (contentLengthValue) {
    headers.set('Content-Length', contentLengthValue);
  } // HTTP-network-or-cache fetch step 2.11


  if (!headers.has('User-Agent')) {
    headers.set('User-Agent', 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)');
  } // HTTP-network-or-cache fetch step 2.15


  if (request.compress && !headers.has('Accept-Encoding')) {
    headers.set('Accept-Encoding', 'gzip,deflate');
  }

  if (!headers.has('Connection') && !request.agent) {
    headers.set('Connection', 'close');
  } // HTTP-network fetch step 4.2
  // chunked encoding is handled by Node.js


  return Object.assign({}, parsedURL, {
    method: request.method,
    headers: exportNodeCompatibleHeaders(headers),
    agent: request.agent
  });
}
/**
 * abort-error.js
 *
 * AbortError interface for cancelled requests
 */

/**
 * Create AbortError instance
 *
 * @param   String      message      Error message for human
 * @return  AbortError
 */


function AbortError(message) {
  Error.call(this, message);
  this.type = 'aborted';
  this.message = message; // hide custom error implementation details from end-users

  Error.captureStackTrace(this, this.constructor);
}

AbortError.prototype = Object.create(Error.prototype);
AbortError.prototype.constructor = AbortError;
AbortError.prototype.name = 'AbortError'; // fix an issue where "PassThrough", "resolve" aren't a named export for node <10

const PassThrough$1 = Stream.PassThrough;
const resolve_url = Url.resolve;
/**
 * Fetch function
 *
 * @param   Mixed    url   Absolute url or Request instance
 * @param   Object   opts  Fetch options
 * @return  Promise
 */

function fetch$1(url, opts) {
  // allow custom promise
  if (!fetch$1.Promise) {
    throw new Error('native promise missing, set fetch.Promise to your favorite alternative');
  }

  Body.Promise = fetch$1.Promise; // wrap http.request into fetch

  return new fetch$1.Promise(function (resolve, reject) {
    // build request object
    const request = new Request(url, opts);
    const options = getNodeRequestOptions(request);
    const send = (options.protocol === 'https:' ? https : http).request;
    const signal = request.signal;
    let response = null;

    const abort = function abort() {
      let error = new AbortError('The user aborted a request.');
      reject(error);

      if (request.body && request.body instanceof Stream.Readable) {
        request.body.destroy(error);
      }

      if (!response || !response.body) return;
      response.body.emit('error', error);
    };

    if (signal && signal.aborted) {
      abort();
      return;
    }

    const abortAndFinalize = function abortAndFinalize() {
      abort();
      finalize();
    }; // send request


    const req = send(options);
    let reqTimeout;

    if (signal) {
      signal.addEventListener('abort', abortAndFinalize);
    }

    function finalize() {
      req.abort();
      if (signal) signal.removeEventListener('abort', abortAndFinalize);
      clearTimeout(reqTimeout);
    }

    if (request.timeout) {
      req.once('socket', function (socket) {
        reqTimeout = setTimeout(function () {
          reject(new FetchError(`network timeout at: ${request.url}`, 'request-timeout'));
          finalize();
        }, request.timeout);
      });
    }

    req.on('error', function (err) {
      reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, 'system', err));
      finalize();
    });
    req.on('response', function (res) {
      clearTimeout(reqTimeout);
      const headers = createHeadersLenient(res.headers); // HTTP fetch step 5

      if (fetch$1.isRedirect(res.statusCode)) {
        // HTTP fetch step 5.2
        const location = headers.get('Location'); // HTTP fetch step 5.3

        const locationURL = location === null ? null : resolve_url(request.url, location); // HTTP fetch step 5.5

        switch (request.redirect) {
          case 'error':
            reject(new FetchError(`redirect mode is set to error: ${request.url}`, 'no-redirect'));
            finalize();
            return;

          case 'manual':
            // node-fetch-specific step: make manual redirect a bit easier to use by setting the Location header value to the resolved URL.
            if (locationURL !== null) {
              // handle corrupted header
              try {
                headers.set('Location', locationURL);
              } catch (err) {
                // istanbul ignore next: nodejs server prevent invalid response headers, we can't test this through normal request
                reject(err);
              }
            }

            break;

          case 'follow':
            // HTTP-redirect fetch step 2
            if (locationURL === null) {
              break;
            } // HTTP-redirect fetch step 5


            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, 'max-redirect'));
              finalize();
              return;
            } // HTTP-redirect fetch step 6 (counter increment)
            // Create a new Request object.


            const requestOpts = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal
            }; // HTTP-redirect fetch step 9

            if (res.statusCode !== 303 && request.body && getTotalBytes(request) === null) {
              reject(new FetchError('Cannot follow redirect with body being a readable stream', 'unsupported-redirect'));
              finalize();
              return;
            } // HTTP-redirect fetch step 11


            if (res.statusCode === 303 || (res.statusCode === 301 || res.statusCode === 302) && request.method === 'POST') {
              requestOpts.method = 'GET';
              requestOpts.body = undefined;
              requestOpts.headers.delete('content-length');
            } // HTTP-redirect fetch step 15


            resolve(fetch$1(new Request(locationURL, requestOpts)));
            finalize();
            return;
        }
      } // prepare response


      res.once('end', function () {
        if (signal) signal.removeEventListener('abort', abortAndFinalize);
      });
      let body = res.pipe(new PassThrough$1());
      const response_options = {
        url: request.url,
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: headers,
        size: request.size,
        timeout: request.timeout
      }; // HTTP-network fetch step 12.1.1.3

      const codings = headers.get('Content-Encoding'); // HTTP-network fetch step 12.1.1.4: handle content codings
      // in following scenarios we ignore compression support
      // 1. compression support is disabled
      // 2. HEAD request
      // 3. no Content-Encoding header
      // 4. no content response (204)
      // 5. content not modified response (304)

      if (!request.compress || request.method === 'HEAD' || codings === null || res.statusCode === 204 || res.statusCode === 304) {
        response = new Response(body, response_options);
        resolve(response);
        return;
      } // For Node v6+
      // Be less strict when decoding compressed responses, since sometimes
      // servers send slightly invalid responses that are still accepted
      // by common browsers.
      // Always using Z_SYNC_FLUSH is what cURL does.


      const zlibOptions = {
        flush: zlib.Z_SYNC_FLUSH,
        finishFlush: zlib.Z_SYNC_FLUSH
      }; // for gzip

      if (codings == 'gzip' || codings == 'x-gzip') {
        body = body.pipe(zlib.createGunzip(zlibOptions));
        response = new Response(body, response_options);
        resolve(response);
        return;
      } // for deflate


      if (codings == 'deflate' || codings == 'x-deflate') {
        // handle the infamous raw deflate response from old servers
        // a hack for old IIS and Apache servers
        const raw = res.pipe(new PassThrough$1());
        raw.once('data', function (chunk) {
          // see http://stackoverflow.com/questions/37519828
          if ((chunk[0] & 0x0F) === 0x08) {
            body = body.pipe(zlib.createInflate());
          } else {
            body = body.pipe(zlib.createInflateRaw());
          }

          response = new Response(body, response_options);
          resolve(response);
        });
        return;
      } // otherwise, use response as-is


      response = new Response(body, response_options);
      resolve(response);
    });
    writeToStream(req, request);
  });
}
/**
 * Redirect code matching
 *
 * @param   Number   code  Status code
 * @return  Boolean
 */


fetch$1.isRedirect = function (code) {
  return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
}; // expose Promise


fetch$1.Promise = global.Promise;

var lib = /*#__PURE__*/Object.freeze({
default: fetch$1,
Headers: Headers,
Request: Request,
Response: Response,
FetchError: FetchError
});

var nodeFetch = getCjsExportFromNamespace(lib);

var nodePonyfill = createCommonjsModule(function (module, exports) {
var realFetch = nodeFetch.default || nodeFetch;

var fetch = function (url, options) {
  // Support schemaless URIs on the server for parity with the browser.
  // Ex: //github.com/ -> https://github.com/
  if (/^\/\//.test(url)) {
    url = 'https:' + url;
  }

  return realFetch.call(this, url, options);
};

module.exports = exports = fetch;
exports.fetch = fetch;
exports.Headers = nodeFetch.Headers;
exports.Request = nodeFetch.Request;
exports.Response = nodeFetch.Response; // Needed for TypeScript consumers without esModuleInterop.

exports.default = fetch;
});
var nodePonyfill_1 = nodePonyfill.fetch;
var nodePonyfill_2 = nodePonyfill.Headers;
var nodePonyfill_3 = nodePonyfill.Request;
var nodePonyfill_4 = nodePonyfill.Response;

var fetch$2 = nodePonyfill.fetch.bind({});
fetch$2.polyfill = true;

if (!commonjsGlobal.fetch) {
  commonjsGlobal.fetch = fetch$2;
  commonjsGlobal.Response = nodePonyfill.Response;
  commonjsGlobal.Headers = nodePonyfill.Headers;
  commonjsGlobal.Request = nodePonyfill.Request;
}

var polyfillPatchFetch = createCommonjsModule(function (module, exports) {
(function (global, factory) {
  factory();
})(commonjsGlobal, function () {

  var classCallCheck = function (instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  };

  var createClass = function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  }();

  var get = function get(object, property, receiver) {
    if (object === null) object = Function.prototype;
    var desc = Object.getOwnPropertyDescriptor(object, property);

    if (desc === undefined) {
      var parent = Object.getPrototypeOf(object);

      if (parent === null) {
        return undefined;
      } else {
        return get(parent, property, receiver);
      }
    } else if ("value" in desc) {
      return desc.value;
    } else {
      var getter = desc.get;

      if (getter === undefined) {
        return undefined;
      }

      return getter.call(receiver);
    }
  };

  var inherits = function (subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
    if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
  };

  var possibleConstructorReturn = function (self, call) {
    if (!self) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return call && (typeof call === "object" || typeof call === "function") ? call : self;
  };

  var Emitter = function () {
    function Emitter() {
      classCallCheck(this, Emitter);
      this.listeners = {};
    }

    createClass(Emitter, [{
      key: 'addEventListener',
      value: function addEventListener(type, callback) {
        if (!(type in this.listeners)) {
          this.listeners[type] = [];
        }

        this.listeners[type].push(callback);
      }
    }, {
      key: 'removeEventListener',
      value: function removeEventListener(type, callback) {
        if (!(type in this.listeners)) {
          return;
        }

        var stack = this.listeners[type];

        for (var i = 0, l = stack.length; i < l; i++) {
          if (stack[i] === callback) {
            stack.splice(i, 1);
            return;
          }
        }
      }
    }, {
      key: 'dispatchEvent',
      value: function dispatchEvent(event) {
        var _this = this;

        if (!(event.type in this.listeners)) {
          return;
        }

        var debounce = function debounce(callback) {
          setTimeout(function () {
            return callback.call(_this, event);
          });
        };

        var stack = this.listeners[event.type];

        for (var i = 0, l = stack.length; i < l; i++) {
          debounce(stack[i]);
        }

        return !event.defaultPrevented;
      }
    }]);
    return Emitter;
  }();

  var AbortSignal = function (_Emitter) {
    inherits(AbortSignal, _Emitter);

    function AbortSignal() {
      classCallCheck(this, AbortSignal);

      var _this2 = possibleConstructorReturn(this, (AbortSignal.__proto__ || Object.getPrototypeOf(AbortSignal)).call(this));

      _this2.aborted = false;
      _this2.onabort = null;
      return _this2;
    }

    createClass(AbortSignal, [{
      key: 'toString',
      value: function toString() {
        return '[object AbortSignal]';
      }
    }, {
      key: 'dispatchEvent',
      value: function dispatchEvent(event) {
        if (event.type === 'abort') {
          this.aborted = true;

          if (typeof this.onabort === 'function') {
            this.onabort.call(this, event);
          }
        }

        get(AbortSignal.prototype.__proto__ || Object.getPrototypeOf(AbortSignal.prototype), 'dispatchEvent', this).call(this, event);
      }
    }]);
    return AbortSignal;
  }(Emitter);

  var AbortController = function () {
    function AbortController() {
      classCallCheck(this, AbortController);
      this.signal = new AbortSignal();
    }

    createClass(AbortController, [{
      key: 'abort',
      value: function abort() {
        var event = void 0;

        try {
          event = new Event('abort');
        } catch (e) {
          if (typeof document !== 'undefined') {
            // For Internet Explorer 11:
            event = document.createEvent('Event');
            event.initEvent('abort', false, false);
          } else {
            // Fallback where document isn't available:
            event = {
              type: 'abort',
              bubbles: false,
              cancelable: false
            };
          }
        }

        this.signal.dispatchEvent(event);
      }
    }, {
      key: 'toString',
      value: function toString() {
        return '[object AbortController]';
      }
    }]);
    return AbortController;
  }();

  if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
    // These are necessary to make sure that we get correct output for:
    // Object.prototype.toString.call(new AbortController())
    AbortController.prototype[Symbol.toStringTag] = 'AbortController';
    AbortSignal.prototype[Symbol.toStringTag] = 'AbortSignal';
  }

  function polyfillNeeded(self) {
    // Note that the "unfetch" minimal fetch polyfill defines fetch() without
    // defining window.Request, and this polyfill need to work on top of unfetch
    // so the below feature detection needs the !self.AbortController part.
    // The Request.prototype check is also needed because Safari versions 11.1.2
    // up to and including 12.1.x has a window.AbortController present but still
    // does NOT correctly implement abortable fetch:
    // https://bugs.webkit.org/show_bug.cgi?id=174980#c2
    return typeof self.Request === 'function' && !self.Request.prototype.hasOwnProperty('signal') || !self.AbortController;
  }
  /**
   * Note: the "fetch.Request" default value is available for fetch imported from
   * the "node-fetch" package and not in browsers. This is OK since browsers
   * will be importing umd-polyfill.js from that path "self" is passed the
   * decorator so the default value will not be used (because browsers that define
   * fetch also has Request). One quirky setup where self.fetch exists but
   * self.Request does not is when the "unfetch" minimal fetch polyfill is used
   * on top of IE11; for this case the browser will try to use the fetch.Request
   * default value which in turn will be undefined but then then "if (Request)"
   * will ensure that you get a patched fetch but still no Request (as expected).
   * @param {fetch, Request = fetch.Request}
   * @returns {fetch: abortableFetch, Request: AbortableRequest}
   */


  function abortableFetchDecorator(patchTargets) {
    if ('function' === typeof patchTargets) {
      patchTargets = {
        fetch: patchTargets
      };
    }

    var _patchTargets = patchTargets,
        fetch = _patchTargets.fetch,
        _patchTargets$Request = _patchTargets.Request,
        NativeRequest = _patchTargets$Request === undefined ? fetch.Request : _patchTargets$Request,
        NativeAbortController = _patchTargets.AbortController;

    if (!polyfillNeeded({
      fetch: fetch,
      Request: NativeRequest,
      AbortController: NativeAbortController
    })) {
      return {
        fetch: fetch,
        Request: Request
      };
    }

    var Request = NativeRequest; // Note that the "unfetch" minimal fetch polyfill defines fetch() without
    // defining window.Request, and this polyfill need to work on top of unfetch
    // hence we only patch it if it's available. Also we don't patch it if signal
    // is already available on the Request prototype because in this case support
    // is present and the patching below can cause a crash since it assigns to
    // request.signal which is technically a read-only property. This latter error
    // happens when you run the main5.js node-fetch example in the repo
    // "abortcontroller-polyfill-examples". The exact error is:
    //   request.signal = init.signal;
    //   ^
    // TypeError: Cannot set property signal of #<Request> which has only a getter

    if (Request && !Request.prototype.hasOwnProperty('signal')) {
      Request = function Request(input, init) {
        var request = new NativeRequest(input, init);

        if (init && init.signal) {
          request.signal = init.signal;
        }

        return request;
      };

      Request.prototype = NativeRequest.prototype;
    }

    var realFetch = fetch;

    var abortableFetch = function abortableFetch(input, init) {
      var signal = Request && Request.prototype.isPrototypeOf(input) ? input.signal : init ? init.signal : undefined;

      if (signal) {
        var abortError = void 0;

        try {
          abortError = new DOMException('Aborted', 'AbortError');
        } catch (err) {
          // IE 11 does not support calling the DOMException constructor, use a
          // regular error object on it instead.
          abortError = new Error('Aborted');
          abortError.name = 'AbortError';
        } // Return early if already aborted, thus avoiding making an HTTP request


        if (signal.aborted) {
          return Promise.reject(abortError);
        } // Turn an event into a promise, reject it once `abort` is dispatched


        var cancellation = new Promise(function (_, reject) {
          signal.addEventListener('abort', function () {
            return reject(abortError);
          }, {
            once: true
          });
        }); // Return the fastest promise (don't need to wait for request to finish)

        return Promise.race([cancellation, realFetch(input, init)]);
      }

      return realFetch(input, init);
    };

    return {
      fetch: abortableFetch,
      Request: Request
    };
  }

  (function (self) {
    if (!polyfillNeeded(self)) {
      return;
    }

    if (!self.fetch) {
      console.warn('fetch() is not available, cannot install abortcontroller-polyfill');
      return;
    }

    var _abortableFetch = abortableFetchDecorator(self),
        fetch = _abortableFetch.fetch,
        Request = _abortableFetch.Request;

    self.fetch = fetch;
    self.Request = Request;
    Object.defineProperty(self, 'AbortController', {
      writable: true,
      enumerable: false,
      configurable: true,
      value: AbortController
    });
    Object.defineProperty(self, 'AbortSignal', {
      writable: true,
      enumerable: false,
      configurable: true,
      value: AbortSignal
    });
  })(typeof self !== 'undefined' ? self : commonjsGlobal);
});
});

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
