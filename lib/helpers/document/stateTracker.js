'use strict';

const parentPaths = require('../path/parentPaths');
const arrayAtomicsSymbol = require('../symbols').arrayAtomicsSymbol;

/**
 * Returns true if any of the given paths is modified, else false.
 *
 * @param {Document} doc
 * @param {string|string[]} [paths]
 * @param {object} [options]
 * @param {string[]} [modifiedPaths]
 * @return {boolean}
 */
function isModified(doc, paths, options, modifiedPaths) {
  if (paths) {
    const ignoreAtomics = options?.ignoreAtomics;
    const directModifiedPathsObj = doc.$__.activePaths.states.modify;
    if (directModifiedPathsObj == null) {
      return false;
    }

    if (typeof paths === 'string') {
      paths = paths.indexOf(' ') === -1 ? [paths] : paths.split(' ');
    }

    for (const path of paths) {
      if (directModifiedPathsObj[path] != null) {
        return true;
      }
    }

    const modified = modifiedPaths || doc.modifiedPaths();
    const isModifiedChild = paths.some(function(path) {
      return !!~modified.indexOf(path);
    });

    let directModifiedPaths = Object.keys(directModifiedPathsObj);
    if (ignoreAtomics) {
      directModifiedPaths = directModifiedPaths.filter(path => {
        const value = doc.$__getValue(path);
        if (value?.[arrayAtomicsSymbol] != null && value[arrayAtomicsSymbol].$set === undefined) {
          return false;
        }
        return true;
      });
    }
    return isModifiedChild || paths.some(function(path) {
      return directModifiedPaths.some(function(mod) {
        return mod === path || path.startsWith(mod + '.');
      });
    });
  }

  return doc.$__.activePaths.some('modify');
}

/**
 * Returns true if path was directly set and modified, else false.
 *
 * @param {Document} doc
 * @param {string|string[]} [path]
 * @return {boolean}
 */
function isDirectModified(doc, path) {
  if (path == null) {
    return doc.$__.activePaths.some('modify');
  }

  if (typeof path === 'string' && path.indexOf(' ') === -1) {
    const res = Object.hasOwn(doc.$__.activePaths.getStatePaths('modify'), path);
    if (res || path.indexOf('.') === -1) {
      return res;
    }

    const pieces = path.split('.');
    for (let i = 0; i < pieces.length - 1; ++i) {
      const subpath = pieces.slice(0, i + 1).join('.');
      const subdoc = doc.$get(subpath);
      if (subdoc?.$__ != null && subdoc.isDirectModified(pieces.slice(i + 1).join('.'))) {
        return true;
      }
    }

    return false;
  }

  let paths = path;
  if (typeof paths === 'string') {
    paths = paths.split(' ');
  }

  return paths.some(p => isDirectModified(doc, p));
}

/**
 * Returns the list of paths that have been modified.
 *
 * @param {Document} doc
 * @param {object} [options]
 * @return {string[]}
 */
function getModifiedPaths(doc, options) {
  options = options || {};

  const directModifiedPaths = Object.keys(doc.$__.activePaths.getStatePaths('modify'));
  const result = new Set();

  let i = 0;
  let j = 0;
  const len = directModifiedPaths.length;

  for (i = 0; i < len; ++i) {
    const path = directModifiedPaths[i];
    const parts = parentPaths(path);
    const pLen = parts.length;

    for (j = 0; j < pLen; ++j) {
      result.add(parts[j]);
    }

    if (!options.includeChildren) {
      continue;
    }

    let ii = 0;
    let cur = doc.$get(path);
    if (typeof cur === 'object' && cur !== null) {
      if (cur._doc) {
        cur = cur._doc;
      }
      const len = cur.length;
      if (Array.isArray(cur)) {
        for (ii = 0; ii < len; ++ii) {
          const subPath = path + '.' + ii;
          if (!result.has(subPath)) {
            result.add(subPath);
            if (cur[ii] != null && cur[ii].$__) {
              const modified = cur[ii].modifiedPaths();
              let iii = 0;
              const iiiLen = modified.length;
              for (iii = 0; iii < iiiLen; ++iii) {
                result.add(subPath + '.' + modified[iii]);
              }
            }
          }
        }
      } else {
        const keys = Object.keys(cur);
        let ii = 0;
        const len = keys.length;
        for (ii = 0; ii < len; ++ii) {
          result.add(path + '.' + keys[ii]);
        }
      }
    }
  }
  return Array.from(result);
}

/**
 * Marks path as modified.
 *
 * @param {Document} doc
 * @param {string} path
 * @param {Document} [scope]
 */
function markModified(doc, path, scope) {
  doc.$__saveInitialState(path);
  doc.$__.activePaths.modify(path);
  if (scope != null && !doc.$isSubdocument) {
    doc.$__.pathsToScopes = doc.$__pathsToScopes || {};
    doc.$__.pathsToScopes[path] = scope;
  }
}

/**
 * Unmarks path as modified.
 *
 * @param {Document} doc
 * @param {string} path
 */
function unmarkModified(doc, path) {
  doc.$__.activePaths.init(path);
  if (doc.$__.pathsToScopes != null) {
    delete doc.$__.pathsToScopes[path];
  }
}

module.exports = {
  isModified,
  isDirectModified,
  getModifiedPaths,
  markModified,
  unmarkModified
};
