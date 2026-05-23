/**
 * @file error.middleware.js
 * @description Global Express error-handling middleware.
 *
 * Must be registered LAST in the Express middleware chain (after all routes).
 * Catches any error passed via next(err) from controllers.
 *
 * Returns a consistent { error: message } JSON response with the appropriate
 * HTTP status code. Logs the full stack trace in non-production environments.
 */

/**
 * Global error handler middleware.
 * Express identifies error handlers by their 4-argument signature.
 *
 * @param {Error & { status?: number }} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next  // eslint-disable-line no-unused-vars
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  const message = err.message || 'An unexpected internal server error occurred.';

  // Log stack trace in development for debugging
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} → ${status}: ${message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  res.status(status).json({ error: message });
}
