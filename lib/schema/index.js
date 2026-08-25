/*!
 * Module exports.
 */

'use strict';

// Core SchemaTypes (Eagerly loaded for fast common path)
exports.Array = require('./array');
exports.Boolean = require('./boolean');
exports.Date = require('./date');
exports.DocumentArray = require('./documentArray');
exports.DocumentArrayElement = require('./documentArrayElement');
exports.Mixed = require('./mixed');
exports.Number = require('./number');
exports.ObjectId = require('./objectId');
exports.String = require('./string');
exports.Subdocument = require('./subdocument');

// Specialized SchemaTypes (Lazily loaded on demand)
const lazyTypes = {
  BigInt: () => require('./bigint'),
  Buffer: () => require('./buffer'),
  Decimal128: () => require('./decimal128'),
  Double: () => require('./double'),
  Int32: () => require('./int32'),
  Map: () => require('./map'),
  UUID: () => require('./uuid'),
  Union: () => require('./union')
};

const cache = new Map();

for (const key of Object.keys(lazyTypes)) {
  Object.defineProperty(exports, key, {
    configurable: true,
    enumerable: true,
    get() {
      if (!cache.has(key)) {
        cache.set(key, lazyTypes[key]());
      }
      return cache.get(key);
    },
    set(val) {
      cache.set(key, val);
    }
  });
}

// Aliases
Object.defineProperty(exports, 'Decimal', {
  configurable: true,
  enumerable: true,
  get() { return exports.Decimal128; },
  set(val) { exports.Decimal128 = val; }
});
exports.Oid = exports.ObjectId;
exports.Object = exports.Mixed;
exports.Bool = exports.Boolean;
exports.ObjectID = exports.ObjectId;
