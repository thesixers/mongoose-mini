/*!
 * Dependencies
 */

'use strict';

const StateMachine = require('./stateMachine');
const ActiveRoster = StateMachine.ctor('require', 'modify', 'init', 'default', 'ignore');

module.exports = exports = InternalCache;

function InternalCache() {
  this.activePaths = new ActiveRoster();
  this.fullPath = undefined;
  this.selected = undefined;
  this.selectedIndex = undefined;
  this.shardval = undefined;
  this.saveError = undefined;
  this.validationError = undefined;
  this.adhocPaths = undefined;
  this.removing = undefined;
  this.inserting = undefined;
  this.saving = undefined;
  this.version = undefined;
  this._id = undefined;
  this.ownerDocument = undefined;
  this.populate = undefined;
  this.populated = undefined;
  this.primitiveAtomics = undefined;
  this.wasPopulated = false;
  this.scope = undefined;
  this.session = null;
  this.pathsToScopes = null;
  this.cachedRequired = null;
  this.skipId = undefined;
  this.priorDoc = undefined;
  this.defaults = undefined;
  this.strictMode = true;
  this.validateModifiedOnly = undefined;
  this.validating = null;
}

InternalCache.prototype.strictMode = true;

InternalCache.prototype.fullPath = undefined;
InternalCache.prototype.selected = undefined;
// Lazily computed index over `selected`, see `_getProjectionIndex()` in document.js
InternalCache.prototype.selectedIndex = undefined;
InternalCache.prototype.shardval = undefined;
InternalCache.prototype.saveError = undefined;
InternalCache.prototype.validationError = undefined;
InternalCache.prototype.adhocPaths = undefined;
InternalCache.prototype.removing = undefined;
InternalCache.prototype.inserting = undefined;
InternalCache.prototype.saving = undefined;
InternalCache.prototype.version = undefined;
InternalCache.prototype._id = undefined;
InternalCache.prototype.ownerDocument = undefined;
InternalCache.prototype.populate = undefined; // what we want to populate in this doc
InternalCache.prototype.populated = undefined;// the _ids that have been populated
InternalCache.prototype.primitiveAtomics = undefined;

/**
 * If `false`, this document was not the result of population.
 * If `true`, this document is a populated doc underneath another doc
 * If an object, this document is a populated doc and the `value` property of the
 * object contains the original depopulated value.
 */
InternalCache.prototype.wasPopulated = false;

InternalCache.prototype.scope = undefined;

InternalCache.prototype.session = null;
InternalCache.prototype.pathsToScopes = null;
InternalCache.prototype.cachedRequired = null;
