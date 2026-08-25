'use strict';

const s = 1000;
const m = s * 60;
const h = m * 60;
const d = h * 24;
const w = d * 7;
const y = d * 365.25;

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return undefined;
  }
  const match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
  if (!match) {
    return undefined;
  }
  const n = parseFloat(match[1]);
  const type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'weeks':
    case 'week':
    case 'w':
      return n * w;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

function fmtShort(msVal) {
  const msAbs = Math.abs(msVal);
  if (msAbs >= d) return Math.round(msVal / d) + 'd';
  if (msAbs >= h) return Math.round(msVal / h) + 'h';
  if (msAbs >= m) return Math.round(msVal / m) + 'm';
  if (msAbs >= s) return Math.round(msVal / s) + 's';
  return msVal + 'ms';
}

function fmtLong(msVal) {
  const msAbs = Math.abs(msVal);
  if (msAbs >= d) return plural(msVal, msAbs, d, 'day');
  if (msAbs >= h) return plural(msVal, msAbs, h, 'hour');
  if (msAbs >= m) return plural(msVal, msAbs, m, 'minute');
  if (msAbs >= s) return plural(msVal, msAbs, s, 'second');
  return msVal + ' ms';
}

function plural(msVal, msAbs, n, name) {
  const isPlural = msAbs >= n * 1.5;
  return Math.round(msVal / n) + ' ' + name + (isPlural ? 's' : '');
}

module.exports = function ms(val, options) {
  options = options || {};
  const type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val));
};
