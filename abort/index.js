"use strict";var Flighty=function(){'use strict';function a(a,b){return b={exports:{}},a(b,b.exports),b.exports}var b="undefined"==typeof window?"undefined"==typeof global?"undefined"==typeof self?{}:self:global:window,c=a(function(){(function(a,b){b()})(b,function(){function a(a){return"function"==typeof a.Request&&!a.Request.prototype.hasOwnProperty("signal")||!a.AbortController}function c(b){"function"==typeof b&&(b={fetch:b});var c=b,d=c.fetch,e=c.Request,f=e===void 0?d.Request:e,g=c.AbortController;if(!a({fetch:d,Request:f,AbortController:g}))return{fetch:d,Request:h};var h=f;h&&!h.prototype.hasOwnProperty("signal")&&(h=function(a,b){var c=new f(a,b);return b&&b.signal&&(c.signal=b.signal),c},h.prototype=f.prototype);var i=d,j=function(a,b){var c=h&&h.prototype.isPrototypeOf(a)?a.signal:b?b.signal:void 0;if(c){var d;try{d=new DOMException("Aborted","AbortError")}catch(a){d=new Error("Aborted"),d.name="AbortError"}if(c.aborted)return Promise.reject(d);var e=new Promise(function(a,b){c.addEventListener("abort",function(){return b(d)},{once:!0})});return Promise.race([e,i(a,b)])}return i(a,b)};return{fetch:j,Request:h}}var d=function(a,b){if(!(a instanceof b))throw new TypeError("Cannot call a class as a function")},e=function(){function a(a,b){for(var c,d=0;d<b.length;d++)c=b[d],c.enumerable=c.enumerable||!1,c.configurable=!0,"value"in c&&(c.writable=!0),Object.defineProperty(a,c.key,c)}return function(b,c,d){return c&&a(b.prototype,c),d&&a(b,d),b}}(),f=function a(b,c,d){null===b&&(b=Function.prototype);var e=Object.getOwnPropertyDescriptor(b,c);if(e===void 0){var f=Object.getPrototypeOf(b);return null===f?void 0:a(f,c,d)}if("value"in e)return e.value;var g=e.get;return void 0===g?void 0:g.call(d)},g=function(a,b){if("function"!=typeof b&&null!==b)throw new TypeError("Super expression must either be null or a function, not "+typeof b);a.prototype=Object.create(b&&b.prototype,{constructor:{value:a,enumerable:!1,writable:!0,configurable:!0}}),b&&(Object.setPrototypeOf?Object.setPrototypeOf(a,b):a.__proto__=b)},h=function(a,b){if(!a)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return b&&("object"==typeof b||"function"==typeof b)?b:a},i=function(){function a(){d(this,a),this.listeners={}}return e(a,[{key:"addEventListener",value:function(a,b){a in this.listeners||(this.listeners[a]=[]),this.listeners[a].push(b)}},{key:"removeEventListener",value:function(a,b){if(a in this.listeners)for(var c=this.listeners[a],d=0,e=c.length;void 0>d;d++)if(c[d]===b)return void c.splice(d,1)}},{key:"dispatchEvent",value:function(a){var b=this;if(a.type in this.listeners){for(var c=function(c){setTimeout(function(){return c.call(b,a)})},d=this.listeners[a.type],e=0,f=d.length;void 0>e;e++)c(d[e]);return!a.defaultPrevented}}}]),a}(),j=function(a){function b(){d(this,b);var a=h(this,(b.__proto__||Object.getPrototypeOf(b)).call(this));return a.aborted=!1,a.onabort=null,a}return g(b,a),e(b,[{key:"toString",value:function(){return"[object AbortSignal]"}},{key:"dispatchEvent",value:function(a){"abort"===a.type&&(this.aborted=!0,"function"==typeof this.onabort&&this.onabort.call(this,a)),f(b.prototype.__proto__||Object.getPrototypeOf(b.prototype),"dispatchEvent",this).call(this,a)}}]),b}(i),k=function(){function a(){d(this,a),this.signal=new j}return e(a,[{key:"abort",value:function(){var a;try{a=new Event("abort")}catch(b){"undefined"==typeof document?a={type:"abort",bubbles:!1,cancelable:!1}:(a=document.createEvent("Event"),a.initEvent("abort",!1,!1))}this.signal.dispatchEvent(a)}},{key:"toString",value:function(){return"[object AbortController]"}}]),a}();"undefined"!=typeof Symbol&&Symbol.toStringTag&&(k.prototype[Symbol.toStringTag]="AbortController",j.prototype[Symbol.toStringTag]="AbortSignal"),function(b){if(a(b)){if(!b.fetch)return void console.warn("fetch() is not available, cannot install abortcontroller-polyfill");var d=c(b),e=d.fetch,f=d.Request;b.fetch=e,b.Request=f,Object.defineProperty(b,"AbortController",{writable:!0,enumerable:!1,configurable:!0,value:k}),Object.defineProperty(b,"AbortSignal",{writable:!0,enumerable:!1,configurable:!0,value:j})}}("undefined"==typeof self?b:self)})}),d=Object.prototype.hasOwnProperty,e=function(){for(var a=[],b=0;256>b;++b)a.push("%"+((16>b?"0":"")+b.toString(16)).toUpperCase());return a}(),f=function(a){for(;1<a.length;){var b=a.pop(),c=b.obj[b.prop];if(Array.isArray(c)){for(var d=[],e=0;e<c.length;++e)"undefined"!=typeof c[e]&&d.push(c[e]);b.obj[b.prop]=d}}},g=function(a,b){for(var c=b&&b.plainObjects?Object.create(null):{},d=0;d<a.length;++d)"undefined"!=typeof a[d]&&(c[d]=a[d]);return c},h={arrayToObject:g,assign:function(a,b){return Object.keys(b).reduce(function(a,c){return a[c]=b[c],a},a)},combine:function(c,a){return[].concat(c,a)},compact:function(a){for(var b=[{obj:{o:a},prop:"o"}],c=[],d=0;d<b.length;++d)for(var e=b[d],g=e.obj[e.prop],h=Object.keys(g),k=0;k<h.length;++k){var l=h[k],m=g[l];"object"==typeof m&&null!==m&&-1===c.indexOf(m)&&(b.push({obj:g,prop:l}),c.push(m))}return f(b),a},decode:function(a,b,c){var d=a.replace(/\+/g," ");if("iso-8859-1"===c)return d.replace(/%[0-9a-f]{2}/gi,unescape);try{return decodeURIComponent(d)}catch(a){return d}},encode:function(a,b,d){if(0===a.length)return a;var f="string"==typeof a?a:a+"";if("iso-8859-1"===d)return escape(f).replace(/%u[0-9a-f]{4}/gi,function(a){return"%26%23"+parseInt(a.slice(2),16)+"%3B"});for(var g,h="",j=0;j<f.length;++j){if(g=f.charCodeAt(j),45===g||46===g||95===g||126===g||48<=g&&57>=g||65<=g&&90>=g||97<=g&&122>=g){h+=f.charAt(j);continue}if(128>g){h+=e[g];continue}if(2048>g){h+=e[192|g>>6]+e[128|63&g];continue}if(55296>g||57344<=g){h+=e[224|g>>12]+e[128|63&g>>6]+e[128|63&g];continue}j+=1,g=65536+((1023&g)<<10|1023&f.charCodeAt(j)),h+=e[240|g>>18]+e[128|63&g>>12]+e[128|63&g>>6]+e[128|63&g]}return h},isBuffer:function(a){return null!==a&&"undefined"!=typeof a&&!!(a.constructor&&a.constructor.isBuffer&&a.constructor.isBuffer(a))},isRegExp:function(a){return"[object RegExp]"===Object.prototype.toString.call(a)},merge:function a(b,c,e){if(!c)return b;if("object"!=typeof c){if(Array.isArray(b))b.push(c);else if("object"==typeof b)(e&&(e.plainObjects||e.allowPrototypes)||!d.call(Object.prototype,c))&&(b[c]=!0);else return[b,c];return b}if("object"!=typeof b)return[b].concat(c);var f=b;return Array.isArray(b)&&!Array.isArray(c)&&(f=g(b,e)),Array.isArray(b)&&Array.isArray(c)?(c.forEach(function(c,f){d.call(b,f)?b[f]&&"object"==typeof b[f]?b[f]=a(b[f],c,e):b.push(c):b[f]=c}),b):Object.keys(c).reduce(function(b,f){var g=c[f];return b[f]=d.call(b,f)?a(b[f],g,e):g,b},f)}},i=String.prototype.replace,j=/%20/g,k={default:"RFC3986",formatters:{RFC1738:function(a){return i.call(a,j,"+")},RFC3986:function(a){return a}},RFC1738:"RFC1738",RFC3986:"RFC3986"},l={brackets:function(a){return a+"[]"},indices:function(a,b){return a+"["+b+"]"},repeat:function(a){return a}},m=Array.isArray,n=Array.prototype.push,o=function(a,b){n.apply(a,m(b)?b:[b])},p=Date.prototype.toISOString,q={addQueryPrefix:!1,allowDots:!1,charset:"utf-8",charsetSentinel:!1,delimiter:"&",encode:!0,encoder:h.encode,encodeValuesOnly:!1,indices:!1,serializeDate:function(a){return p.call(a)},skipNulls:!1,strictNullHandling:!1},r=function a(b,c,d,e,f,g,j,k,l,m,n,p,r){var s=b;if("function"==typeof j?s=j(c,s):s instanceof Date&&(s=m(s)),null===s){if(e)return g&&!p?g(c,q.encoder,r):c;s=""}if("string"==typeof s||"number"==typeof s||"boolean"==typeof s||h.isBuffer(s)){if(g){var t=p?c:g(c,q.encoder,r);return[n(t)+"="+n(g(s,q.encoder,r))]}return[n(c)+"="+n(s+"")]}var u=[];if("undefined"==typeof s)return u;var v;if(Array.isArray(j))v=j;else{var w=Object.keys(s);v=k?w.sort(k):w}for(var x,y=0;y<v.length;++y)(x=v[y],!(f&&null===s[x]))&&(Array.isArray(s)?o(u,a(s[x],d(c,x),d,e,f,g,j,k,l,m,n,p,r)):o(u,a(s[x],c+(l?"."+x:"["+x+"]"),d,e,f,g,j,k,l,m,n,p,r)));return u},s=function(a,b){var c=a,d=b?h.assign({},b):{};if(null!==d.encoder&&void 0!==d.encoder&&"function"!=typeof d.encoder)throw new TypeError("Encoder has to be a function.");var e="undefined"==typeof d.delimiter?q.delimiter:d.delimiter,f="boolean"==typeof d.strictNullHandling?d.strictNullHandling:q.strictNullHandling,g="boolean"==typeof d.skipNulls?d.skipNulls:q.skipNulls,j="boolean"==typeof d.encode?d.encode:q.encode,m="function"==typeof d.encoder?d.encoder:q.encoder,n="function"==typeof d.sort?d.sort:null,p="undefined"==typeof d.allowDots?q.allowDots:!!d.allowDots,s="function"==typeof d.serializeDate?d.serializeDate:q.serializeDate,t="boolean"==typeof d.encodeValuesOnly?d.encodeValuesOnly:q.encodeValuesOnly,u=d.charset||q.charset;if("undefined"!=typeof d.charset&&"utf-8"!==d.charset&&"iso-8859-1"!==d.charset)throw new Error("The charset option must be either utf-8, iso-8859-1, or undefined");if("undefined"==typeof d.format)d.format=k["default"];else if(!Object.prototype.hasOwnProperty.call(k.formatters,d.format))throw new TypeError("Unknown format option provided.");var v,w,x=k.formatters[d.format];"function"==typeof d.filter?(w=d.filter,c=w("",c)):Array.isArray(d.filter)&&(w=d.filter,v=w);var y=[];if("object"!=typeof c||null===c)return"";var z=d.arrayFormat in l?d.arrayFormat:"indices"in d?d.indices?"indices":"repeat":"indices";var A=l[z];v||(v=Object.keys(c)),n&&v.sort(n);for(var B,C=0;C<v.length;++C)(B=v[C],!(g&&null===c[B]))&&o(y,r(c[B],B,A,f,g,j?m:null,w,n,p,s,x,t,u));var D=y.join(e),E=!0===d.addQueryPrefix?"?":"";return d.charsetSentinel&&("iso-8859-1"===u?E+="utf8=%26%2310003%3B&":E+="utf8=%E2%9C%93&"),0<D.length?E+D:""},t=Object.prototype.hasOwnProperty,u={allowDots:!1,allowPrototypes:!1,arrayLimit:20,charset:"utf-8",charsetSentinel:!1,decoder:h.decode,delimiter:"&",depth:5,ignoreQueryPrefix:!1,interpretNumericEntities:!1,parameterLimit:1e3,parseArrays:!0,plainObjects:!1,strictNullHandling:!1},v=function(a){return a.replace(/&#(\d+);/g,function(a,b){return String.fromCharCode(parseInt(b,10))})},w=function(a,b){var c,d={},e=b.ignoreQueryPrefix?a.replace(/^\?/,""):a,f=b.parameterLimit===1/0?void 0:b.parameterLimit,g=e.split(b.delimiter,f),j=-1,k=b.charset;if(b.charsetSentinel)for(c=0;c<g.length;++c)0===g[c].indexOf("utf8=")&&(g[c]==="utf8=%E2%9C%93"?k="utf-8":g[c]==="utf8=%26%2310003%3B"&&(k="iso-8859-1"),j=c,c=g.length);for(c=0;c<g.length;++c)if(c!==j){var l,m,n=g[c],o=n.indexOf("]="),p=-1===o?n.indexOf("="):o+1;-1===p?(l=b.decoder(n,u.decoder,k),m=b.strictNullHandling?null:""):(l=b.decoder(n.slice(0,p),u.decoder,k),m=b.decoder(n.slice(p+1),u.decoder,k)),m&&b.interpretNumericEntities&&"iso-8859-1"===k&&(m=v(m)),d[l]=t.call(d,l)?h.combine(d[l],m):m}return d},x=function(a,b,c){for(var d=b,e=a.length-1;0<=e;--e){var f,g=a[e];if("[]"===g&&c.parseArrays)f=[].concat(d);else{f=c.plainObjects?Object.create(null):{};var h="["===g.charAt(0)&&"]"===g.charAt(g.length-1)?g.slice(1,-1):g,j=parseInt(h,10);c.parseArrays||""!==h?!isNaN(j)&&g!==h&&j+""===h&&0<=j&&c.parseArrays&&j<=c.arrayLimit?(f=[],f[j]=d):f[h]=d:f={0:d}}d=f}return d},y=function(a,b,c){if(a){var d=c.allowDots?a.replace(/\.([^.[]+)/g,"[$1]"):a,e=/(\[[^[\]]*])/,f=/(\[[^[\]]*])/g,g=e.exec(d),h=g?d.slice(0,g.index):d,j=[];if(h){if(!c.plainObjects&&t.call(Object.prototype,h)&&!c.allowPrototypes)return;j.push(h)}for(var k=0;null!==(g=f.exec(d))&&k<c.depth;){if(k+=1,!c.plainObjects&&t.call(Object.prototype,g[1].slice(1,-1))&&!c.allowPrototypes)return;j.push(g[1])}return g&&j.push("["+d.slice(g.index)+"]"),x(j,b,c)}},z={formats:k,parse:function(a,b){var c=b?h.assign({},b):{};if(null!==c.decoder&&void 0!==c.decoder&&"function"!=typeof c.decoder)throw new TypeError("Decoder has to be a function.");if(c.ignoreQueryPrefix=!0===c.ignoreQueryPrefix,c.delimiter="string"==typeof c.delimiter||h.isRegExp(c.delimiter)?c.delimiter:u.delimiter,c.depth="number"==typeof c.depth?c.depth:u.depth,c.arrayLimit="number"==typeof c.arrayLimit?c.arrayLimit:u.arrayLimit,c.parseArrays=!1!==c.parseArrays,c.decoder="function"==typeof c.decoder?c.decoder:u.decoder,c.allowDots="undefined"==typeof c.allowDots?u.allowDots:!!c.allowDots,c.plainObjects="boolean"==typeof c.plainObjects?c.plainObjects:u.plainObjects,c.allowPrototypes="boolean"==typeof c.allowPrototypes?c.allowPrototypes:u.allowPrototypes,c.parameterLimit="number"==typeof c.parameterLimit?c.parameterLimit:u.parameterLimit,c.strictNullHandling="boolean"==typeof c.strictNullHandling?c.strictNullHandling:u.strictNullHandling,"undefined"!=typeof c.charset&&"utf-8"!==c.charset&&"iso-8859-1"!==c.charset)throw new Error("The charset option must be either utf-8, iso-8859-1, or undefined");if("undefined"==typeof c.charset&&(c.charset=u.charset),""===a||null===a||"undefined"==typeof a)return c.plainObjects?Object.create(null):{};for(var d="string"==typeof a?w(a,c):a,e=c.plainObjects?Object.create(null):{},f=Object.keys(d),g=0;g<f.length;++g){var j=f[g],k=y(j,d[j],c);e=h.merge(e,k,c)}return h.compact(e)},stringify:s},A=a(function(a){(function(b,c,d){a.exports?a.exports=d():c[b]=d()})("urljoin",b,function(){function a(a){var b=[];if(a[0].match(/^[^/:]+:\/*$/)&&1<a.length){var c=a.shift();a[0]=c+a[0]}a[0]=a[0].match(/^file:\/\/\//)?a[0].replace(/^([^/:]+):\/*/,"$1:///"):a[0].replace(/^([^/:]+):\/*/,"$1://");for(var d,e=0;e<a.length;e++){if(d=a[e],"string"!=typeof d)throw new TypeError("Url must be a string. Received "+d);""!==d&&(0<e&&(d=d.replace(/^[\/]+/,"")),d=e<a.length-1?d.replace(/[\/]+$/,""):d.replace(/[\/]+$/,"/"),b.push(d))}var f=b.join("/");f=f.replace(/\/(\?|&|#[^!])/g,"$1");var g=f.split("?");return f=g.shift()+(0<g.length?"?":"")+g.join("&"),f}return function(){var b;return b="object"==typeof arguments[0]?arguments[0]:[].slice.call(arguments),a(b)}})});const B=(a,b)=>{if(a){const c=b.get(a);!c||--c.count||b.delete(a)}},C=({abortToken:a,signal:b},c,d)=>{if(!a&&!b)return c.signal;let e=new AbortController;if(a){const b=d.get(a)||{controller:e,count:0};b.count++,d.set(a,b),e=b.controller}return b&&(b.aborted?e.abort():b.addEventListener("abort",()=>e.abort())),c.signal.addEventListener("abort",()=>e.abort()),e.signal},D=a=>new Promise(b=>setTimeout(()=>b(),a)),E=(a,b)=>{if("function"!=typeof a)throw new Error(b)},F=async(a,{retries:c=0,retryDelay:d=1e3,retryFn:b})=>{if(E(a,"retry function is not a function"),isNaN(c)||0>c)throw new Error("retries must be a number greater than or equal to 0");if(d&&isNaN(d))throw new Error("retryDelay must be a number (milliseconds)");if(b&&"function"!=typeof b)throw new Error("retryFn must be callable");const e=async(...a)=>b?b(...a):D(d);let f=-1;const g=async b=>{try{return f++,await a(f)}catch(a){if(!b)throw a;return await e(f+1,a),g(--b)}},h=await g(c);return{count:f,res:h}},G=async(a,{retries:b,retryDelay:c,retryFn:d,retryOn:f=[],signal:e})=>{if(E(a,"retry function is not a function"),f&&!Array.isArray(f))throw new Error("retryOn must be an array of response statii");if(null!=e&&"boolean"!=typeof e.aborted)throw new Error("signal must have boolean \"aborted\" property");return F(async c=>{const d=await a();if(-1===f.indexOf(d.status)||b===c)return d;throw new Error(d)},{retries:b,retryFn:async(a,b)=>{if(e&&e.aborted)throw b;return d?d(a,b):D(c)}})};if("undefined"==typeof fetch)throw new Error("You're missing a fetch implementation. Try var Flighty = require('flighty/fetch') or import Flighty from 'flighty/fetch'");if("undefined"==typeof AbortController)throw new Error("You're missing an AbortController implementation. Try var Flighty = require('flighty/abort') or import Flighty from 'flighty/abort'");const H=["GET","POST","PUT","HEAD","OPTIONS","DEL","PATCH"],I=(a,b,c,d)=>{const e={...d,method:"del"===a?"DELETE":a.toUpperCase(),headers:{...(b.headers||{}),...d.headers}};e.headers=Object.keys(e.headers).reduce((a,b)=>{const c=e.headers[b];return c?{[b]:c,...a}:a},{}),e.body||"POST"!==a||(e.body=""),"GET"===a&&e.body&&(c+=`?${z.stringify(e.body,{arrayFormat:b.arrayFormat})}`,delete e.body),e.body&&"object"==typeof e.body&&(e.body=JSON.stringify(e.body));const f=b.baseURI?A(b.baseURI,c):c;return fetch(f,e)},J=(a,b,{path:c,options:d},e,f=0)=>{const{retries:k=0,retryDelay:l=1e3,retryOn:m=[],retryFn:g,abortToken:h,signal:i,...j}=d,n=C({abortToken:h,signal:i},b.abortController,b.abortTokenMap),o={method:a,call:{path:c,options:{...d},extra:{...e}},retry:()=>(f++,J(a,b,{path:c,options:{...d}},{...e},f))},p=Array.from(b.interceptors),q=p.reduce((a,b)=>(a=a.then(a=>a.slice(0,2).concat([{...e},f])),b.request&&(a=a.then(a=>b.request(...a))),b.requestError&&(a=a.catch(b.requestError)),a),Promise.resolve([c,j])),r=p.reverse().reduce((a,b)=>(b.response&&(a=a.then(b.response)),b.responseError&&(a=a.catch(b.responseError)),a),(async()=>{const[c,d]=await q,{count:e,res:h}=await G(()=>I(a,b,c,{...d,signal:n}),{retries:k,retryDelay:l,retryOn:m,retryFn:g,signal:n});f+=e,h.flighty=o;let i,j;try{i=await h.clone().json()}catch(a){}try{j=await h.clone().text()}catch(a){}return h.flighty={...o,retryCount:f,json:i,text:j},h})());return r.finally(()=>(B(h,b.abortTokenMap),r))};return class{constructor(a={}){H.forEach(a=>this[a.toLowerCase()]=(b="/",c={},d={})=>J(a,this,{path:b,options:c},d));let b;const c=new Set,d=new Map;Object.defineProperties(this,{headers:{get(){return a.headers},set(b={}){a={...a,headers:b}}},arrayFormat:{get(){return a.arrayFormat||"indicies"}},baseURI:{get(){return a.baseURI},set(b){a={...a,baseURI:b}}},interceptors:{get(){return c}},interceptor:{get(){return{register:a=>this.registerInterceptor(a),unregister:a=>this.removeInterceptor(a),clear:()=>this.clearInterceptors()}}},abortController:{get(){return b||(b=new AbortController,b.signal.addEventListener("abort",()=>{b=null})),b}},abortTokenMap:{get(){return d}}})}abort(a){const b=this.abortTokenMap.get(a);return b&&b.controller.abort()}abortAll(){this.abortController.abort()}registerInterceptor(a){if(!a)throw new Error("cannot register a null interceptor");return this.interceptors.add(a),()=>this.interceptors.delete(a)}clearInterceptors(){this.interceptors.clear()}removeInterceptor(a){this.interceptors.delete(a)}auth(a,b){this.headers={...this.headers,Authorization:a&&b?`Basic ${(a=>"undefined"==typeof btoa?Buffer.from(a).toString("base64"):btoa(a))(`${a}:${b}`)}`:null}}jwt(a){return this.headers={...this.headers,Authorization:a?`Bearer ${a}`:null},this}}}();
//# sourceMappingURL=index.js.map
