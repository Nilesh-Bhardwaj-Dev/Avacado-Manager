import mongoose from 'mongoose';
import { publicIdPlugin } from './plugins/publicId.plugin.js';

const projectSchema = new mongoose.Schema(
  {
    organizationId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    key: { type: String, required: true },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    description: { type: String, default: '' },
    createdBy: { type: String, default: null },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'projects' }
);

projectSchema.index({ organizationId: 1, key: 1 }, { unique: true });
projectSchema.plugin(publicIdPlugin);

export const ProjectModel = mongoose.models.Project || mongoose.model('Project', projectSchema);
