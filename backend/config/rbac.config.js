/**
 * @file rbac.config.js
 * @description RBAC feature flags and settings.
 */

export const rbacConfig = {
  legacyMode: process.env.RBAC_LEGACY_MODE === 'true',
  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
  allowSelfServeOrgCreate: process.env.ALLOW_SELF_SERVE_ORG === 'true',
  emailVerificationExpiresHours: Number(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS || 24),
  invitationExpiresHours: Number(process.env.INVITATION_EXPIRES_HOURS || 72),
};
