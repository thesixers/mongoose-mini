'use strict';

const MongooseError = require('../../error/index');
const ValidationError = require('../../error/validation');
const utils = require('../../utils');

const STATES_TO_VALIDATE = Object.freeze(['init', 'default', 'modify']);
const STAR_CHAR_CODE = '*'.charCodeAt(0);
const documentArrayParent = Symbol.for('mongoose#documentArrayParent');

/**
 * Event emitting and error persisting logic for validate().
 *
 * @param {Document} doc
 * @return {Error}
 */
function completeValidate(doc) {
  let error = doc.$__.validationError;
  doc.$__.validationError = null;
  doc.$__.validating = null;

  if (doc.$__.validateModifiedOnly && error != null) {
    const errors = Object.keys(error.errors);
    for (const errPath of errors) {
      if (!doc.$isModified(errPath)) {
        delete error.errors[errPath];
      }
    }
    if (utils.hasOwnKeys(error.errors) === false) {
      error = void 0;
    }
  }

  doc.$__.cachedRequired = null;
  doc.$emit('validate', doc);
  doc.constructor.emit('validate', doc);

  if (error) {
    for (const key in error.errors) {
      if (!doc[documentArrayParent] &&
          error.errors[key] instanceof MongooseError.CastError) {
        doc.invalidate(key, error.errors[key]);
      }
    }
  }

  return error;
}

/**
 * Gathers paths that need validation.
 *
 * @param {Document} doc
 * @param {string[]|Set} [pathsToValidate]
 * @param {string[]|Set} [pathsToSkip]
 * @param {boolean} [isNestedValidate]
 * @return {object} { paths, doValidateOptionsByPath }
 */
function getPathsToValidate(doc, pathsToValidate, pathsToSkip, isNestedValidate) {
  const doValidateOptions = {};
  const schema = doc.$__schema;
  const schemaPaths = schema.paths;
  const activeStates = doc.$__.activePaths.states;

  let _modifiedPaths;
  const getModifiedPaths = () => (_modifiedPaths ??= doc.modifiedPaths());

  let paths = [];
  const requireStates = activeStates.require;
  if (requireStates != null) {
    let modifiedPaths = null;
    for (const path in requireStates) {
      const type = Object.hasOwn(schemaPaths, path) ? schemaPaths[path] : schema.path(path);
      if (typeof type?.originalRequiredValue === 'function') {
        const cachedRequired = doc.$__.cachedRequired ?? (doc.$__.cachedRequired = {});
        try {
          cachedRequired[path] = type.originalRequiredValue.call(doc, doc);
        } catch (err) {
          doc.invalidate(path, err);
        }
      }

      if (!doc.$__isSelected(path)) {
        if (modifiedPaths === null) {
          modifiedPaths = doc.modifiedPaths();
        }
        if (!doc.$isModified(path, null, modifiedPaths)) {
          continue;
        }
      }
      if (path.charCodeAt(path.length - 1) === STAR_CHAR_CODE && path.endsWith('.$*')) {
        continue;
      }
      const cachedRequired = doc.$__.cachedRequired;
      if (cachedRequired != null && path in cachedRequired) {
        if (cachedRequired[path]) {
          paths.push(path);
        }
      } else {
        paths.push(path);
      }
    }
  }

  for (let i = 0; i < STATES_TO_VALIDATE.length; ++i) {
    const statePaths = activeStates[STATES_TO_VALIDATE[i]];
    if (statePaths == null) {
      continue;
    }
    for (const p in statePaths) {
      if (p.charCodeAt(p.length - 1) === STAR_CHAR_CODE && p.endsWith('.$*')) {
        continue;
      }

      const _pathType = Object.hasOwn(schemaPaths, p) ? schemaPaths[p] : schema.path(p);
      if (!_pathType) {
        continue;
      }

      if (pathsToValidate != null && pathsToValidate.size > 0 && !pathsToValidate.has(p)) {
        if (!_pathType.$isSingleNested && !_pathType.$isMongooseDocumentArray) {
          continue;
        }
      }

      if (pathsToSkip != null && pathsToSkip.has(p)) {
        continue;
      }

      if (_pathType.$isSingleNested) {
        if (!doc.$isModified(p, null, getModifiedPaths())) {
          continue;
        }
      }

      paths.push(p);
    }
  }

  return { paths, doValidateOptionsByPath: doValidateOptions };
}

module.exports = {
  completeValidate,
  getPathsToValidate
};
