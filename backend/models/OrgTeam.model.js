import mongoose from 'mongoose';
import { publicIdPlugin } from './plugins/publicId.plugin.js';

/** Organization-scoped team (distinct from legacy `teams` collection) */
const orgTeamSchema = new mongoose.Schema(
  {
    organizationId: { type: String, required: true, index: true },
    projectId: { type: String, default: null, index: true },
    name: { type: String, required: true },
    memberIds: { type: [String], default: [] },
    leadUserId: { type: String, default: null },
    legacyOwnerId: { type: String, default: null },
  },
  { timestamps: true, collection: 'org_teams' }
);

orgTeamSchema.index({ organizationId: 1, name: 1 });
orgTeamSchema.plugin(publicIdPlugin);

export const OrgTeamModel = mongoose.models.OrgTeam || mongoose.model('OrgTeam', orgTeamSchema);
