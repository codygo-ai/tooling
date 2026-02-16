/**
 * Parse package.json AST node into usable structure.
 *
 * @param {any} node - ESLint Program node
 * @returns {any} Parsed package.json (ObjectExpression)
 */
export function parsePackageJson(node) {
  if (!node || !node.body || node.body.length === 0) {
    return {};
  }

  const firstBody = node.body[0];
  const expression = firstBody.expression;

  if (!expression) {
    return {};
  }

  // jsonc-eslint-parser uses JSONObjectExpression, not ObjectExpression
  if (expression.type !== 'ObjectExpression' && expression.type !== 'JSONObjectExpression') {
    return {};
  }

  return expression;
}

/**
 * Get property node from package.json AST.
 *
 * @param {any} pkg - Parsed package object
 * @param {string} propertyName - Property name
 * @returns {any} Property node or null
 */
export function getProperty(pkg, propertyName) {
  if (!pkg.properties) return undefined;

  return (
    pkg.properties.find((/** @type {any} */ prop) => {
      return prop.key && (prop.key.value === propertyName || prop.key.name === propertyName);
    }) || undefined
  );
}

/**
 * Get property value from package.json.
 *
 * @param {any} pkg - Parsed package object
 * @param {string} propertyName - Property name
 * @returns {any} Property value
 */
export function getPropertyValue(pkg, propertyName) {
  const prop = getProperty(pkg, propertyName);

  if (!prop || !prop.value) return undefined;

  // Handle literal values (strings, numbers, booleans, null)
  if (prop.value.type === 'Literal' || prop.value.type === 'JSONLiteral') {
    return prop.value.value;
  }

  // Handle objects and arrays
  if (
    prop.value.type === 'ObjectExpression' ||
    prop.value.type === 'ArrayExpression' ||
    prop.value.type === 'JSONObjectExpression' ||
    prop.value.type === 'JSONArrayExpression'
  ) {
    return prop.value;
  }

  return undefined;
}

/**
 * Check if property exists in package.json.
 *
 * @param {any} pkg - Parsed package object
 * @param {string} propertyName - Property name
 * @returns {boolean} True if exists
 */
export function hasProperty(pkg, propertyName) {
  return getProperty(pkg, propertyName) !== undefined;
}

/**
 * Get entries from object property.
 *
 * @param {any} obj - Object property node
 * @returns {Array<[string, any]>} Key-value tuples
 */
export function getObjectEntries(obj) {
  if (!obj) return [];

  // Handle both direct ObjectExpression and Property nodes
  let target = obj;
  if (obj.type === 'Property' || obj.type === 'JSONProperty') {
    target = obj.value;
  }

  if (!target || !target.properties) return [];

  return target.properties.map((/** @type {any} */ prop) => {
    const key = prop.key.value || prop.key.name;
    return [key, prop.value];
  });
}

/**
 * Check if package.json has comment containing text.
 *
 * @param {import('eslint').Rule.RuleContext} context - ESLint context
 * @param {string} searchText - Text to search for
 * @returns {boolean} True if found
 */
export function hasCommentContaining(context, searchText) {
  const sourceCode = context.sourceCode;
  const comments = sourceCode.getAllComments();

  return comments.some((comment) => comment.value.includes(searchText));
}
