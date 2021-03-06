'use strict';

var AsyncSubject = require('../asyncsubject');
var asObservable  = require('./asobservable');
var isFunction = require('../helpers/isfunction');
var tryCatch = require('../internal/trycatchutils').tryCatch;

function createCbHandler(o, ctx, selector) {
  return function handler () {
    var len = arguments.length, results = new Array(len);
    for(var i = 0; i < len; i++) { results[i] = arguments[i]; }

    if (isFunction(selector)) {
      results = tryCatch(selector).apply(ctx, results);
      if (results === global._Rx.errorObj) { return o.onError(results.e); }
      o.onNext(results);
    } else {
      if (results.length <= 1) {
        o.onNext(results[0]);
      } else {
        o.onNext(results);
      }
    }

    o.onCompleted();
  };
}

function createCbObservable(fn, ctx, selector, args) {
  var o = new AsyncSubject();

  args.push(createCbHandler(o, ctx, selector));
  var res = tryCatch(fn).apply(ctx, args);
  if (res === global._Rx.errorObj) { o.onError(res.e); }

  return asObservable(o);
}

/**
 * Converts a callback function to an observable sequence.
 *
 * @param {Function} fn Function with a callback as the last parameter to convert to an Observable sequence.
 * @param {Mixed} [ctx] The context for the func parameter to be executed.  If not specified, defaults to undefined.
 * @param {Function} [selector] A selector which takes the arguments from the callback to produce a single item to yield on next.
 * @returns {Function} A function, when executed with the required parameters minus the callback, produces an Observable sequence with a single value of the arguments to the callback as an array.
 */
module.exports = function bindCallback (fn, ctx, selector) {
  return function () {
    typeof ctx === 'undefined' && (ctx = this);

    var len = arguments.length, args = new Array(len);
    for(var i = 0; i < len; i++) { args[i] = arguments[i]; }
    return createCbObservable(fn, ctx, selector, args);
  };
};
