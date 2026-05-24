import mongoose from 'mongoose';
import { publicIdPlugin } from './plugins/publicId.plugin.js';

const invitationTokenSchema = new mongoose.Schema(
  {
    organizationId: { type: String, required: true, index: true },
    projectId: { type: String, default: null },
    email: { type: String, required: true },
    roleId: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    invitedBy: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'invitation_tokens' }
);

invitationTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
invitationTokenSchema.plugin(publicIdPlugin);

export const InvitationTokenModel = mongoose.models.InvitationToken
  || mongoose.model('InvitationToken', invitationTokenSchema);
