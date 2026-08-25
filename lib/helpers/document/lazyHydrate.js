'use strict';

const fullHydrateMethods = new Set([
  'save', '$save', 'validate', '$validate', 'toObject', 'toJSON',
  'isModified', 'markModified', 'getChanges', '$getChanges', 'inspect'
]);

/**
 * Creates an ES6 Proxy around a Document instance for lazy JIT field hydration.
 *
 * @param {Document} doc The Document instance
 * @param {object} rawDoc The raw MongoDB BSON/POJO document
 * @param {object} [options]
 * @return {Proxy<Document>}
 */
function createLazyDocumentProxy(doc, rawDoc, options) {
  const hydratedFields = new Set();
  let isFullyHydrated = false;

  function hydrateField(prop) {
    if (isFullyHydrated || hydratedFields.has(prop)) {
      return;
    }
    hydratedFields.add(prop);
    const schema = doc.$__schema;
    const schemaType = schema.path(prop);
    if (schemaType && Object.hasOwn(rawDoc, prop)) {
      doc._doc[prop] = schemaType.cast(rawDoc[prop], doc, false);
    } else if (Object.hasOwn(rawDoc, prop)) {
      doc._doc[prop] = rawDoc[prop];
    }
  }

  function hydrateAll() {
    if (isFullyHydrated) {
      return;
    }
    isFullyHydrated = true;
    doc.$init(rawDoc, options);
  }

  return new Proxy(doc, {
    get(target, prop, receiver) {
      if (typeof prop === 'symbol') {
        return Reflect.get(target, prop, receiver);
      }

      // Intercept full-hydration methods
      if (fullHydrateMethods.has(prop)) {
        hydrateAll();
        const value = target[prop];
        return typeof value === 'function' ? value.bind(target) : value;
      }

      // Internal Mongoose symbols / properties
      if (prop.startsWith('$') || prop.startsWith('_')) {
        return Reflect.get(target, prop, receiver);
      }

      // Check if property exists on raw document and needs JIT field hydration
      if (rawDoc != null && Object.hasOwn(rawDoc, prop) && !hydratedFields.has(prop)) {
        hydrateField(prop);
      }

      return Reflect.get(target, prop, receiver);
    }
  });
}

module.exports = createLazyDocumentProxy;
