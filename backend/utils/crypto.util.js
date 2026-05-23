/**
 * @file crypto.util.js
 * @description Cryptographic utilities (non-password).
 */
import crypto from 'crypto';
import { hashPassword as argonHash } from '../services/password.service.js';

/**
 * @deprecated Use password.service.hashPassword — kept for import compatibility during migration.
 * @param {string} plain
 */
export async function hashPassword(plain) {
  return argonHash(plain);
}

/**
 * @returns {string}
 */
export function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}
