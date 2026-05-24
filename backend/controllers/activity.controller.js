/**
 * @file activity.controller.js
 * @description Business logic for the activity feed.
 * Exports: getActivities, deleteActivities
 */
import { getDB } from '../config/db.js';
import { logActivity } from '../utils/activity.util.js';

/**
 * GET /api/activities
 * Returns the 20 most recent workspace activity events, newest first.
 */
export async function getActivities(req, res, next) {
  try {
    const db = getDB();
    let query = {};
    if (req.context?.organizationId) {
      query.organizationId = req.context.organizationId;
    } else {
      const ownerId = req.user.accountRole === 'admin' ? req.user.id : (req.user.accountRole === 'user' ? req.user.managedBy : null);
      if (ownerId) query.ownerId = ownerId;
    }
    const activities = await db
      .collection('activities')
      .find(query)
      .sort({ id: -1 })
      .limit(20)
      .toArray();

    res.json(activities);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/activities
 * Deletes workspace activities based on a date range (?range=all|last-week|last-month).
 */
export async function deleteActivities(req, res, next) {
  try {
    const { range } = req.query;
    const db = getDB();
    let query = {};
    let ownerId = null;

    if (req.context?.organizationId) {
      query.organizationId = req.context.organizationId;
    } else {
      ownerId = req.user.accountRole === 'admin' ? req.user.id : req.user.managedBy;
      if (ownerId) query.ownerId = ownerId;
    }

    const now = new Date();

    if (range === 'last-week') {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: cutoff };
    } else if (range === 'last-month') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: cutoff };
    } else if (range === 'all') {
      // query ready
    } else {
      return res.status(400).json({ error: "Invalid range parameter. Use 'all', 'last-week', or 'last-month'." });
    }

    const result = await db.collection('activities').deleteMany(query);

    // Log this action to the activity feed
    await logActivity(`${req.user.name} cleared activities (range: ${range})`, ownerId, req.context?.organizationId || null);

    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    next(err);
  }
}
