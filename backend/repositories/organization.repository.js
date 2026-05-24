import { OrganizationModel } from '../models/Organization.model.js';

export const organizationRepository = {
  findById(id) {
    return OrganizationModel.findOne({ id }).lean();
  },

  findBySlug(slug) {
    return OrganizationModel.findOne({ slug }).lean();
  },

  findByLegacyOwnerId(legacyOwnerId) {
    return OrganizationModel.findOne({ legacyOwnerId }).lean();
  },

  listForUser(orgIds) {
    return OrganizationModel.find({ id: { $in: orgIds }, status: 'active' }).lean();
  },

  listAll(filters = {}) {
    return OrganizationModel.find(filters).sort({ createdAt: -1 }).lean();
  },

  create(data) {
    return OrganizationModel.create(data);
  },

  updateById(id, updates) {
    return OrganizationModel.findOneAndUpdate({ id }, { $set: updates }, { new: true }).lean();
  },

  deleteById(id) {
    return OrganizationModel.findOneAndDelete({ id });
  },
};
