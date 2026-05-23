/**
 * @file validate.middleware.js
 * @description express-validator result handler.
 */
import { validationResult } from 'express-validator';

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0]?.msg || 'Validation failed.',
      details: errors.array(),
    });
  }
  next();
}
