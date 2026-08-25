'use strict';

function stringToParts(str) {
  const result = [];
  let curPropertyName = '';
  let state = 'DEFAULT';
  for (let i = 0; i < str.length; ++i) {
    if (state === 'IN_SQUARE_BRACKETS' && !/\d/.test(str[i]) && str[i] !== ']') {
      state = 'DEFAULT';
      curPropertyName = result[result.length - 1] + '[' + curPropertyName;
      result.splice(result.length - 1, 1);
    }

    if (str[i] === '[') {
      if (state !== 'IMMEDIATELY_AFTER_SQUARE_BRACKETS') {
        result.push(curPropertyName);
        curPropertyName = '';
      }
      state = 'IN_SQUARE_BRACKETS';
    } else if (str[i] === ']') {
      if (state === 'IN_SQUARE_BRACKETS') {
        state = 'IMMEDIATELY_AFTER_SQUARE_BRACKETS';
        result.push(curPropertyName);
        curPropertyName = '';
      } else {
        state = 'DEFAULT';
        curPropertyName += str[i];
      }
    } else if (str[i] === '.') {
      if (state !== 'IMMEDIATELY_AFTER_SQUARE_BRACKETS') {
        result.push(curPropertyName);
        curPropertyName = '';
      }
      state = 'DEFAULT';
    } else {
      curPropertyName += str[i];
    }
  }

  if (state !== 'IMMEDIATELY_AFTER_SQUARE_BRACKETS') {
    result.push(curPropertyName);
  }

  return result;
}

const ignoreProperties = ['__proto__', 'constructor', 'prototype'];

function K(v) {
  return v;
}

exports.stringToParts = stringToParts;

exports.get = function(path, o, special, map) {
  let lookup;
  if ('function' === typeof special) {
    if (special.length < 2) {
      map = special;
      special = undefined;
    } else {
      lookup = special;
      special = undefined;
    }
  }
  map || (map = K);

  const parts = 'string' === typeof path ? stringToParts(path) : path;

  if (!Array.isArray(parts)) {
    throw new TypeError('Invalid `path`. Must be either string or array');
  }

  let obj = o;
  let part;

  for (let i = 0; i < parts.length; ++i) {
    part = parts[i];
    if (typeof parts[i] !== 'string' && typeof parts[i] !== 'number') {
      throw new TypeError('Each segment of path to `get()` must be a string or number, got ' + typeof parts[i]);
    }

    if (Array.isArray(obj) && !/^\d+$/.test(part)) {
      const paths = parts.slice(i);
      return [].concat(obj).map(function(item) {
        return item
          ? exports.get(paths, item, special || lookup, map)
          : map(undefined);
      });
    }

    if (lookup) {
      obj = lookup(obj, part);
    } else {
      const _from = special && obj && obj[special] ? obj[special] : obj;
      obj = _from instanceof Map ? _from.get(part) : (_from ? _from[part] : undefined);
    }

    if (!obj) return map(obj);
  }

  return map(obj);
};

exports.has = function(path, o) {
  const parts = typeof path === 'string' ? stringToParts(path) : path;
  if (!Array.isArray(parts)) {
    throw new TypeError('Invalid `path`. Must be either string or array');
  }

  const len = parts.length;
  let cur = o;
  for (let i = 0; i < len; ++i) {
    if (typeof parts[i] !== 'string' && typeof parts[i] !== 'number') {
      throw new TypeError('Each segment of path to `has()` must be a string or number, got ' + typeof parts[i]);
    }
    if (cur == null || typeof cur !== 'object' || !(parts[i] in cur)) {
      return false;
    }
    cur = cur[parts[i]];
  }
  return true;
};

exports.unset = function(path, o) {
  const parts = typeof path === 'string' ? stringToParts(path) : path;
  if (!Array.isArray(parts)) {
    throw new TypeError('Invalid `path`. Must be either string or array');
  }

  const len = parts.length;
  let cur = o;
  for (let i = 0; i < len; ++i) {
    if (cur == null || typeof cur !== 'object' || !(parts[i] in cur)) {
      return false;
    }
    if (typeof parts[i] !== 'string' && typeof parts[i] !== 'number') {
      throw new TypeError('Each segment of path to `unset()` must be a string or number, got ' + typeof parts[i]);
    }
    if (ignoreProperties.indexOf(parts[i]) !== -1) {
      return false;
    }
    if (i === len - 1) {
      delete cur[parts[i]];
      return true;
    }
    cur = cur instanceof Map ? cur.get(parts[i]) : cur[parts[i]];
  }
  return true;
};

exports.set = function(path, val, o, special, map, _copying) {
  let lookup;
  if ('function' === typeof special) {
    if (special.length < 2) {
      map = special;
      special = undefined;
    } else {
      lookup = special;
      special = undefined;
    }
  }
  map || (map = K);

  const parts = 'string' === typeof path ? stringToParts(path) : path;
  if (!Array.isArray(parts)) {
    throw new TypeError('Invalid `path`. Must be either string or array');
  }
  if (null == o) return;

  for (let i = 0; i < parts.length; ++i) {
    if (typeof parts[i] !== 'string' && typeof parts[i] !== 'number') {
      throw new TypeError('Each segment of path to `set()` must be a string or number, got ' + typeof parts[i]);
    }
    if (ignoreProperties.indexOf(parts[i]) !== -1) {
      return;
    }
  }

  const copy = _copying || (/\$/.test(path) && _copying !== false);
  let obj = o;
  let part;

  for (let i = 0, len = parts.length - 1; i < len; ++i) {
    part = parts[i];
    if ('$' === part) {
      if (i === len - 1) break;
      else continue;
    }

    if (Array.isArray(obj) && !/^\d+$/.test(part)) {
      const paths = parts.slice(i);
      if (!copy && Array.isArray(val)) {
        for (let j = 0; j < obj.length && j < val.length; ++j) {
          exports.set(paths, val[j], obj[j], special || lookup, map, copy);
        }
      } else {
        for (let j = 0; j < obj.length; ++j) {
          exports.set(paths, val, obj[j], special || lookup, map, copy);
        }
      }
      return;
    }

    if (lookup) {
      obj = lookup(obj, part);
    } else {
      const _to = special && obj && obj[special] ? obj[special] : obj;
      obj = _to instanceof Map ? _to.get(part) : (_to ? _to[part] : undefined);
    }
    if (!obj) return;
  }

  part = parts[parts.length - 1];

  if (special && obj && obj[special]) {
    obj = obj[special];
  }

  if (Array.isArray(obj) && !/^\d+$/.test(part)) {
    if (!copy && Array.isArray(val)) {
      _setArray(obj, val, part, lookup, special, map);
    } else {
      for (let j = 0; j < obj.length; ++j) {
        let item = obj[j];
        if (item) {
          if (lookup) {
            lookup(item, part, map(val));
          } else {
            if (item[special]) item = item[special];
            item[part] = map(val);
          }
        }
      }
    }
  } else {
    if (lookup) {
      lookup(obj, part, map(val));
    } else if (obj instanceof Map) {
      obj.set(part, map(val));
    } else {
      obj[part] = map(val);
    }
  }
};

function _setArray(obj, val, part, lookup, special, map) {
  for (let item, j = 0; j < obj.length && j < val.length; ++j) {
    item = obj[j];
    if (Array.isArray(item) && Array.isArray(val[j])) {
      _setArray(item, val[j], part, lookup, special, map);
    } else if (item) {
      if (lookup) {
        lookup(item, part, map(val[j]));
      } else {
        if (item[special]) item = item[special];
        item[part] = map(val[j]);
      }
    }
  }
}
