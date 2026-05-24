import { OrganizationMembershipModel } from '../models/OrganizationMembership.model.js';
import { ProjectMembershipModel } from '../models/ProjectMembership.model.js';

export const membershipRepository = {
  findOrgMembership(organizationId, userId) {
    return OrganizationMembershipModel.findOne({
      organizationId,
      userId,
      status: { $in: ['active', 'invited'] },
    }).lean();
  },

  listOrgMemberships(organizationId) {
    return OrganizationMembershipModel.find({ organizationId }).lean();
  },

  listUserOrgMemberships(userId) {
    return OrganizationMembershipModel.find({ userId, status: 'active' }).lean();
  },

  createOrgMembership(data) {
    return OrganizationMembershipModel.create(data);
  },

  updateOrgMembership(organizationId, userId, updates) {
    return OrganizationMembershipModel.findOneAndUpdate(
      { organizationId, userId },
      { $set: updates },
      { new: true }
    ).lean();
  },

  deleteOrgMembership(organizationId, userId) {
    return OrganizationMembershipModel.findOneAndDelete({ organizationId, userId });
  },

  findProjectMembership(projectId, userId) {
    return ProjectMembershipModel.findOne({
      projectId,
      userId,
      status: { $in: ['active', 'invited'] },
    }).lean();
  },

  listProjectMemberships(projectId) {
    return ProjectMembershipModel.find({ projectId }).lean();
  },

  listUserProjectMemberships(userId, organizationId) {
    return ProjectMembershipModel.find({ userId, organizationId, status: 'active' }).lean();
  },

  createProjectMembership(data) {
    return ProjectMembershipModel.create(data);
  },

  updateProjectMembership(projectId, userId, updates) {
    return ProjectMembershipModel.findOneAndUpdate(
      { projectId, userId },
      { $set: updates },
      { new: true }
    ).lean();
  },

  deleteProjectMembership(projectId, userId) {
    return ProjectMembershipModel.findOneAndDelete({ projectId, userId });
  },
};
