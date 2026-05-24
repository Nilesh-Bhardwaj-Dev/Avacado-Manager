/**
 * @file index.js
 * @description Mongoose model exports.
 */
export { PermissionModel } from './Permission.model.js';
export { RoleModel } from './Role.model.js';
export { OrganizationModel } from './Organization.model.js';
export { ProjectModel } from './Project.model.js';
export { OrgTeamModel } from './OrgTeam.model.js';
export { OrganizationMembershipModel } from './OrganizationMembership.model.js';
export { ProjectMembershipModel } from './ProjectMembership.model.js';
export { RbacAuditLogModel } from './RbacAuditLog.model.js';
export { EmailVerificationTokenModel } from './EmailVerificationToken.model.js';
export { InvitationTokenModel } from './InvitationToken.model.js';

import { PermissionModel } from './Permission.model.js';
import { RoleModel } from './Role.model.js';
import { OrganizationModel } from './Organization.model.js';
import { ProjectModel } from './Project.model.js';
import { OrgTeamModel } from './OrgTeam.model.js';
import { OrganizationMembershipModel } from './OrganizationMembership.model.js';
import { ProjectMembershipModel } from './ProjectMembership.model.js';
import { RbacAuditLogModel } from './RbacAuditLog.model.js';
import { EmailVerificationTokenModel } from './EmailVerificationToken.model.js';
import { InvitationTokenModel } from './InvitationToken.model.js';
import { logger } from '../utils/logger.js';

const MODELS = [
  PermissionModel,
  RoleModel,
  OrganizationModel,
  ProjectModel,
  OrgTeamModel,
  OrganizationMembershipModel,
  ProjectMembershipModel,
  RbacAuditLogModel,
  EmailVerificationTokenModel,
  InvitationTokenModel,
];

/**
 * Sync indexes for all Mongoose RBAC models.
 */
export async function ensureRbacIndexes() {
  for (const model of MODELS) {
    await model.syncIndexes();
  }
  logger.info('RBAC Mongoose indexes synced');
}
