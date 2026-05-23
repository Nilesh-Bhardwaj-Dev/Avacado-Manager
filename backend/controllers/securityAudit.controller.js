/**
 * @file securityAudit.controller.js
 * @description Super Admin security audit log API.
 */
import { listAuditLogs } from '../services/audit.service.js';
import { getDB } from '../config/db.js';
import { Collections } from '../constants/collections.js';

export async function listSecurityAuditLogs(req, res, next) {
  try {
    const limit = Number(req.query.limit) || 100;
    const event = req.query.event;
    const query = event ? { event } : {};
    const logs = await listAuditLogs(query, limit);
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

export async function listLoginHistory(req, res, next) {
  try {
    const db = getDB();
    const userId = req.query.userId || req.user.id;
    const history = await db
      .collection(Collections.LOGIN_HISTORY)
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    res.json(history);
  } catch (err) {
    next(err);
  }
}
