/**
 * @file auth.validators.js
 * @description Request validation rules for auth endpoints.
 */
import { body } from 'express-validator';

export const loginValidators = [
  body('identifier').optional().trim(),
  body('email').optional().trim(),
  body().custom((_, { req }) => {
    if (!req.body.identifier && !req.body.email) {
      throw new Error('Username or email is required.');
    }
    return true;
  }),
  body('password').notEmpty().withMessage('Password is required.'),
  body('totpCode').optional().trim(),
];

export const forgotPasswordValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required.'),
];

export const resetPasswordValidators = [
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.'),
  body('token').optional().trim(),
  body('email').optional().trim(),
  body('otp').optional().trim(),
];

export const changePasswordValidators = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters.'),
];

export const twoFactorVerifyValidators = [
  body('token').notEmpty().withMessage('Authenticator code is required.'),
];

export const twoFactorLoginValidators = [
  body('tempToken').notEmpty(),
  body('totpCode').notEmpty(),
];
