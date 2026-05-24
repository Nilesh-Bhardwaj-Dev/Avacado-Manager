/**
 * @file auth.routes.js
 * @description Authentication API routes.
 */
import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { csrfProtection } from '../middleware/csrf.middleware.js';
import { authRateLimiter } from '../middleware/rateLimit.middleware.js';
import { handleValidationErrors } from '../middleware/validate.middleware.js';
import {
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  twoFactorLoginValidators,
} from '../validators/auth.validators.js';
import {
  login,
  verify2faLogin,
  refresh,
  logout,
  logoutAll,
  getSession,
  forgotPassword,
  resetPasswordWithToken,
  listSessions,
  verifyEmail,
  resendVerification,
} from '../controllers/auth.controller.js';
import {
  setup2fa,
  enable2fa,
  disable2fa,
} from '../controllers/twoFactor.controller.js';
import { body } from 'express-validator';

const router = Router();

// Public auth (rate limited)
router.post('/login', authRateLimiter, loginValidators, handleValidationErrors, login);
router.post(
  '/2fa/verify-login',
  authRateLimiter,
  twoFactorLoginValidators,
  handleValidationErrors,
  verify2faLogin
);
router.post('/refresh', authRateLimiter, refresh);
router.get('/session', getSession);
router.post(
  '/forgot-password',
  authRateLimiter,
  forgotPasswordValidators,
  handleValidationErrors,
  forgotPassword
);
router.post(
  '/reset-password',
  authRateLimiter,
  resetPasswordValidators,
  handleValidationErrors,
  resetPasswordWithToken
);
router.post(
  '/verify-email',
  authRateLimiter,
  body('token').notEmpty(),
  handleValidationErrors,
  verifyEmail
);

// Protected
router.use(authenticate);
router.post('/resend-verification', authRateLimiter, resendVerification);
router.post('/logout', csrfProtection, logout);
router.post('/logout-all', csrfProtection, logoutAll);
router.get('/sessions', listSessions);

router.get('/2fa/setup', setup2fa);
router.post('/2fa/enable', csrfProtection, body('token').notEmpty(), handleValidationErrors, enable2fa);
router.post(
  '/2fa/disable',
  csrfProtection,
  body('password').notEmpty(),
  handleValidationErrors,
  disable2fa
);

export default router;
