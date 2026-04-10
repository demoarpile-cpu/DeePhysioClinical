/**
 * Convert a snake_case string to camelCase
 */
const toCamelCase = (str) => {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
};

/**
 * Recursively transform all keys in an object/array from snake_case to camelCase
 */
const transformKeys = (data) => {
  if (Array.isArray(data)) {
    return data.map(transformKeys);
  }

  const isPlainObject =
    data !== null &&
    typeof data === 'object' &&
    Object.getPrototypeOf(data) === Object.prototype;

  if (isPlainObject) {
    const transformed = {};

    for (const key of Object.keys(data)) {
      const camelKey = toCamelCase(key);
      transformed[camelKey] = transformKeys(data[key]);
    }

    return transformed;
  }

  return data;
};

/**
 * Express middleware that intercepts res.json()
 * and transforms snake_case keys inside `data` to camelCase
 */
const responseTransformer = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (body && body.success === true && body.data !== undefined) {
      body.data = transformKeys(body.data);
    }

    return originalJson(body);
  };

  next();
};

module.exports = responseTransformer;
