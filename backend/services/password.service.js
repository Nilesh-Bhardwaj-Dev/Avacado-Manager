/**
 * @file password.service.js
 * @description Argon2 password hashing, validation, and legacy SHA-256 migration.
 */
import crypto from 'crypto';
import argon2 from 'argon2';
import { authConfig } from '../config/auth.config.js';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 65536, // 64 MB
  timeCost: 3,
  parallelism: 4,
};

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8, message: 'Password must be at least 8 characters.' },
  { test: (p) => /[A-Z]/.test(p), message: 'Password must include an uppercase letter.' },
  { test: (p) => /[a-z]/.test(p), message: 'Password must include a lowercase letter.' },
  { test: (p) => /\d/.test(p), message: 'Password must include a number.' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), message: 'Password must include a special character.' },
];

/**
 * Validates password strength.
 * @param {string} password
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePasswordStrength(password) {
  const errors = PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.message);
  return { valid: errors.length === 0, errors };
}

/**
 * @param {string} plainPassword
 * @returns {Promise<string>}
 */
export async function hashPassword(plainPassword) {
  return argon2.hash(plainPassword, ARGON2_OPTIONS);
}

/**
 * @param {string} plainPassword
 * @param {string} storedHash
 * @returns {Promise<{ valid: boolean, needsUpgrade: boolean }>}
 */
export async function verifyPassword(plainPassword, storedHash) {
  if (!storedHash) return { valid: false, needsUpgrade: false };

  if (storedHash.startsWith('$argon2')) {
    const valid = await argon2.verify(storedHash, plainPassword);
    return { valid, needsUpgrade: false };
  }

  // Legacy: client previously sent SHA-256 hex; stored value is 64-char hex digest
  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    const legacyDigest = crypto.createHash('sha256').update(plainPassword).digest('hex');
    const valid = legacyDigest === storedHash.toLowerCase();
    return { valid, needsUpgrade: valid };
  }

  return { valid: false, needsUpgrade: false };
}

/**
 * Prevents reusing recent passwords.
 * @param {string} plainPassword
 * @param {string[]} passwordHistory - array of previous password hashes
 * @returns {Promise<boolean>} true if password was used before
 */
export async function isPasswordReused(plainPassword, passwordHistory = []) {
  for (const oldHash of passwordHistory) {
    const { valid } = await verifyPassword(plainPassword, oldHash);
    if (valid) return true;
  }
  return false;
}

/**
 * @param {string} currentHash
 * @param {string[]} history
 * @returns {string[]}
 */
export function appendPasswordHistory(currentHash, history = []) {
  const next = [currentHash, ...history];
  return next.slice(0, authConfig.security.passwordHistoryCount);
}

/**
 * Generates a random password that satisfies strength rules.
 * @returns {string}
 */
export function generateCompliantPassword() {
  const random = crypto.randomBytes(10).toString('base64url');
  return `Aa1!${random}`;
}
