import { ProjectModel } from '../models/Project.model.js';

export const projectRepository = {
  findById(id) {
    return ProjectModel.findOne({ id }).lean();
  },

  findByOrgAndId(organizationId, projectId) {
    return ProjectModel.findOne({ id: projectId, organizationId }).lean();
  },

  listByOrg(organizationId) {
    return ProjectModel.find({ organizationId, status: 'active' }).sort({ name: 1 }).lean();
  },

  findDefaultByOrg(organizationId) {
    return ProjectModel.findOne({ organizationId, isDefault: true }).lean();
  },

  create(data) {
    return ProjectModel.create(data);
  },

  updateById(id, updates) {
    return ProjectModel.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  },

  deleteById(id) {
    return ProjectModel.findOneAndDelete({ id });
  },
};
