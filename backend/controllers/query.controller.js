/**
 * @file query.controller.js
 * @description Raise Query feature — admins and users submit queries;
 * super admin receives and resolves them.
 */
import { getDB } from '../config/db.js';
import { sendNotification } from '../utils/notification.util.js';
import { logActivity } from '../utils/activity.util.js';

const VALID_CATEGORIES = ['general', 'technical', 'account', 'billing', 'other'];
const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_STATUSES = ['open', 'in_progress', 'resolved'];

function generateQueryId() {
  return 'query-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
}

async function findSuperAdmin(db) {
  return db.collection('users').findOne({ accountRole: 'superadmin', status: 'active' });
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN / USER — Raise & view own queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/queries
 * Create a new query (admin or user).
 */
export async function createQuery(req, res, next) {
  try {
    const { subject, message, category = 'general', priority = 'medium' } = req.body;

    if (!subject?.trim() || !message?.trim()) {
      return res.status(400).json({ error: 'Subject and message are required.' });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Allowed: ${VALID_CATEGORIES.join(', ')}` });
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority. Allowed: ${VALID_PRIORITIES.join(', ')}` });
    }

    const db = getDB();
    const now = new Date();

    const query = {
      id: generateQueryId(),
      subject: subject.trim(),
      message: message.trim(),
      category,
      priority,
      status: 'open',
      raisedBy: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        accountRole: req.user.accountRole,
      },
      resolution: null,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('queries').insertOne(query);

    const superAdmin = await findSuperAdmin(db);
    if (superAdmin) {
      await sendNotification({
        type: 'QUERY_RAISED',
        recipientId: superAdmin.id,
        title: 'New Query Raised',
        message: `${req.user.name} (${req.user.accountRole}): ${subject.trim()}`,
      });
    }

    await logActivity(
      `${req.user.name} raised query: ${subject.trim()}`,
      req.user.managedBy || req.user.id
    );

    res.status(201).json(query);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/queries
 * List queries raised by the current user.
 */
export async function listMyQueries(req, res, next) {
  try {
    const db = getDB();
    const queries = await db.collection('queries')
      .find({ 'raisedBy.id': req.user.id })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(queries);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/queries/:id
 * Get a single query (owner only).
 */
export async function getMyQuery(req, res, next) {
  try {
    const db = getDB();
    const query = await db.collection('queries').findOne({
      id: req.params.id,
      'raisedBy.id': req.user.id,
    });

    if (!query) {
      return res.status(404).json({ error: 'Query not found.' });
    }

    res.json(query);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUPER ADMIN — View & resolve all queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/superadmin/queries
 * List all queries (super admin only).
 */
export async function listAllQueries(req, res, next) {
  try {
    const db = getDB();
    const { status } = req.query;

    const filter = {};
    if (status && VALID_STATUSES.includes(status)) {
      filter.status = status;
    }

    const queries = await db.collection('queries')
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();

    res.json(queries);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/superadmin/queries/stats
 * Query counts for super admin dashboard.
 */
export async function getQueryStats(req, res, next) {
  try {
    const db = getDB();
    const queries = db.collection('queries');

    const [total, open, inProgress, resolved] = await Promise.all([
      queries.countDocuments(),
      queries.countDocuments({ status: 'open' }),
      queries.countDocuments({ status: 'in_progress' }),
      queries.countDocuments({ status: 'resolved' }),
    ]);

    res.json({ total, open, inProgress, resolved });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/superadmin/queries/:id
 * Update query status or resolve with a message.
 */
export async function updateQuery(req, res, next) {
  try {
    const { status, resolutionMessage } = req.body;
    const db = getDB();

    const query = await db.collection('queries').findOne({ id: req.params.id });
    if (!query) {
      return res.status(404).json({ error: 'Query not found.' });
    }

    const updates = { updatedAt: new Date() };

    if (status) {
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}` });
      }
      updates.status = status;
    }

    if (status === 'resolved') {
      if (!resolutionMessage?.trim()) {
        return res.status(400).json({ error: 'Resolution message is required when resolving a query.' });
      }
      updates.resolution = {
        message: resolutionMessage.trim(),
        resolvedBy: { id: req.user.id, name: req.user.name },
        resolvedAt: new Date(),
      };
    }

    if (Object.keys(updates).length === 1) {
      return res.status(400).json({ error: 'Provide status and/or resolutionMessage to update.' });
    }

    await db.collection('queries').updateOne({ id: req.params.id }, { $set: updates });

    const updated = await db.collection('queries').findOne({ id: req.params.id });

    if (status === 'resolved' && query.raisedBy?.id) {
      await sendNotification({
        type: 'QUERY_RESOLVED',
        recipientId: query.raisedBy.id,
        title: 'Query Resolved',
        message: `Your query "${query.subject}" has been resolved.`,
      });
    }

    await logActivity(
      `Super Admin updated query "${query.subject}" → ${updates.status || query.status}`,
      'superadmin'
    );

    res.json(updated);
  } catch (err) {
    next(err);
  }
}
