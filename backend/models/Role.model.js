import mongoose from 'mongoose';
import { publicIdPlugin } from './plugins/publicId.plugin.js';

const roleSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, index: true },
    name: { type: String, required: true },
    scope: { type: String, enum: ['platform', 'organization', 'project'], required: true },
    organizationId: { type: String, default: null, index: true },
    isSystem: { type: Boolean, default: false },
    inheritsFromRoleId: { type: String, default: null },
    permissionKeys: { type: [String], default: [] },
  },
  { timestamps: true, collection: 'roles' }
);

roleSchema.index({ key: 1, organizationId: 1 }, { unique: true });
roleSchema.plugin(publicIdPlugin);

export const RoleModel = mongoose.models.Role || mongoose.model('Role', roleSchema);
