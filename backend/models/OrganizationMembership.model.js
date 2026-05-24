import mongoose from 'mongoose';
import { publicIdPlugin } from './plugins/publicId.plugin.js';

const orgMembershipSchema = new mongoose.Schema(
  {
    organizationId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    roleId: { type: String, required: true },
    status: { type: String, enum: ['active', 'invited', 'suspended'], default: 'active' },
    invitedBy: { type: String, default: null },
    joinedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'organization_memberships' }
);

orgMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
orgMembershipSchema.plugin(publicIdPlugin);

export const OrganizationMembershipModel = mongoose.models.OrganizationMembership
  || mongoose.model('OrganizationMembership', orgMembershipSchema);
