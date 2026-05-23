/**
 * @file sanitize.middleware.js
 * @description NoSQL injection protection (Express 5 compatible).
 *
 * express-mongo-sanitize mutates req.query, which is read-only in Express 5.
 * This middleware only sanitizes req.body and req.params.
 */

const PROHIBITED_KEY = /^\$|\./;

/**
 * Recursively removes keys that start with $ or contain . (MongoDB operators).
 * @param {*} value
 */
function sanitizeValue(value) {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (typeof value === 'object') {
    const clean = {};
    for (const [key, val] of Object.entries(value)) {
      if (PROHIBITED_KEY.test(key)) continue;
      clean[key] = sanitizeValue(val);
    }
    return clean;
  }

  return value;
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function sanitizeInputs(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeValue(req.params);
  }
  // req.query is read-only in Express 5 — sanitize a copy if needed downstream
  next();
}
