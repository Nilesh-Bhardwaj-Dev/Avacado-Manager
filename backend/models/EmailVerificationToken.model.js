import mongoose from 'mongoose';
import { publicIdPlugin } from './plugins/publicId.plugin.js';

const emailVerificationTokenSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'email_verification_tokens' }
);

emailVerificationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
emailVerificationTokenSchema.plugin(publicIdPlugin);

export const EmailVerificationTokenModel = mongoose.models.EmailVerificationToken
  || mongoose.model('EmailVerificationToken', emailVerificationTokenSchema);
