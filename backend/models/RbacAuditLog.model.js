import mongoose from 'mongoose';
import { publicIdPlugin } from './plugins/publicId.plugin.js';

const rbacAuditLogSchema = new mongoose.Schema(
  {
    organizationId: { type: String, default: null, index: true },
    projectId: { type: String, default: null, index: true },
    actorId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    resourceType: { type: String, default: null },
    resourceId: { type: String, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'rbac_audit_logs' }
);

rbacAuditLogSchema.index({ createdAt: -1 });
rbacAuditLogSchema.plugin(publicIdPlugin);

export const RbacAuditLogModel = mongoose.models.RbacAuditLog
  || mongoose.model('RbacAuditLog', rbacAuditLogSchema);
