import mongoose from 'mongoose';
import { publicIdPlugin } from './plugins/publicId.plugin.js';

const projectMembershipSchema = new mongoose.Schema(
  {
    organizationId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    roleId: { type: String, required: true },
    status: { type: String, enum: ['active', 'invited', 'suspended'], default: 'active' },
    invitedBy: { type: String, default: null },
    joinedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'project_memberships' }
);

projectMembershipSchema.index({ projectId: 1, userId: 1 }, { unique: true });
projectMembershipSchema.plugin(publicIdPlugin);

export const ProjectMembershipModel = mongoose.models.ProjectMembership
  || mongoose.model('ProjectMembership', projectMembershipSchema);
