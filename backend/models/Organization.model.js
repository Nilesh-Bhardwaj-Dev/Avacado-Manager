import mongoose from 'mongoose';
import { publicIdPlugin } from './plugins/publicId.plugin.js';

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
    settings: {
      timezone: { type: String, default: 'UTC' },
      branding: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    billing: {
      plan: { type: String, default: 'free' },
      stripeCustomerId: { type: String, default: null },
    },
    createdBy: { type: String, default: null },
    legacyOwnerId: { type: String, default: null, index: true },
  },
  { timestamps: true, collection: 'organizations' }
);

organizationSchema.plugin(publicIdPlugin);

export const OrganizationModel = mongoose.models.Organization
  || mongoose.model('Organization', organizationSchema);
