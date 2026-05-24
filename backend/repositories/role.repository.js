import { RoleModel } from '../models/Role.model.js';

export const roleRepository = {
  findById(id) {
    return RoleModel.findOne({ id }).lean();
  },

  findSystemByKey(key) {
    return RoleModel.findOne({ key, organizationId: null, isSystem: true }).lean();
  },

  findByOrg(orgId, filters = {}) {
    return RoleModel.find({
      $or: [{ organizationId: null, isSystem: true }, { organizationId: orgId }],
      ...filters,
    }).lean();
  },

  create(data) {
    return RoleModel.create(data);
  },

  updateById(id, updates) {
    return RoleModel.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  },

  deleteById(id) {
    return RoleModel.findOneAndDelete({ id });
  },
};
