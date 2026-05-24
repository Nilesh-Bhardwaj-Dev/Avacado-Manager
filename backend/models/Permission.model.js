import mongoose from 'mongoose';
import { publicIdPlugin } from './plugins/publicId.plugin.js';

const permissionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    scope: { type: String, enum: ['platform', 'organization', 'project'], required: true },
  },
  { timestamps: true, collection: 'permissions' }
);

permissionSchema.plugin(publicIdPlugin);

export const PermissionModel = mongoose.models.Permission
  || mongoose.model('Permission', permissionSchema);
