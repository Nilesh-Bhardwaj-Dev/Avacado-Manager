/**
 * @file superadmin.controller.js
 * @description Business logic for Super Admin management operations.
 * Handles CRUD for admin accounts, user oversight, password resets,
 * account status toggling, and dashboard statistics.
 */
import { getDB } from '../config/db.js';
import { hashPasswordForStorage } from '../services/auth.service.js';
import { AuditEvent, writeAuditLog } from '../services/audit.service.js';
import { logActivity } from '../utils/activity.util.js';
import { sendWelcomeEmail, sendAdminPasswordResetEmail } from '../services/email.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/superadmin/stats
 * Returns aggregate counts for the Super Admin dashboard.
 */
export async function getDashboardStats(req, res, next) {
  try {
    const db = getDB();
    const users = db.collection('users');

    const [totalAdmins, totalUsers, activeAccounts, inactiveAccounts] = await Promise.all([
      users.countDocuments({ accountRole: 'admin' }),
      users.countDocuments({ accountRole: 'user' }),
      users.countDocuments({ status: 'active', accountRole: { $ne: 'superadmin' } }),
      users.countDocuments({ status: 'inactive' }),
    ]);

    res.json({ totalAdmins, totalUsers, activeAccounts, inactiveAccounts });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/superadmin/admins
 * Lists all admin accounts with their managed user counts.
 */
export async function listAdmins(req, res, next) {
  try {
    const db = getDB();
    const admins = await db.collection('users')
      .find({ accountRole: 'admin' })
      .project({ password: 0 })
      .toArray();

    // Attach managed user count to each admin
    for (const admin of admins) {
      admin.managedUserCount = await db.collection('users')
        .countDocuments({ managedBy: admin.id, accountRole: 'user' });
    }

    res.json(admins);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/superadmin/admins
 * Creates a new admin account.
 */
export async function createAdmin(req, res, next) {
  try {
    const { name, email, username, password, role, team, maxUsers } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({
        error: 'Name, email, username, and password are required.',
      });
    }

    const db = getDB();

    // Check for duplicate username or email
    const existing = await db.collection('users').findOne({
      $or: [
        { username: username.trim().toLowerCase() },
        { email: email.trim().toLowerCase() },
      ],
    });

    if (existing) {
      return res.status(409).json({
        error: `An account with this ${existing.username === username.trim().toLowerCase() ? 'username' : 'email'} already exists.`,
      });
    }

    const id = 'user-' + Date.now();
    const adminDoc = {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password: await hashPasswordForStorage(password),
      role: (role || 'Product Manager').trim(),
      team: team || null,
      accountRole: 'admin',
      status: 'active',
      maxUsers: parseInt(maxUsers) || 25,
      managedBy: null,
      avatar: name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      bio: '',
    };

    await db.collection('users').insertOne(adminDoc);

    // Auto-seed default teams for new admin's workspace
    const defaultTeams = [
      { name: 'Backend Engineering', ownerId: id },
      { name: 'Frontend Engineering', ownerId: id },
      { name: 'QA Testing', ownerId: id },
      { name: 'Product Management', ownerId: id },
      { name: 'UI/UX Design', ownerId: id },
    ];
    await db.collection('teams').insertMany(defaultTeams);

    await logActivity(`Super Admin created admin account '${name}'`, 'superadmin');
    await writeAuditLog({
      event: AuditEvent.USER_CREATED,
      userId: id,
      actorId: req.user.id,
      actorName: req.user.name,
      metadata: { accountRole: 'admin', email: adminDoc.email },
      req,
    });

    sendWelcomeEmail({
      name: adminDoc.name,
      email: adminDoc.email,
      username: adminDoc.username,
      password,
      accountRole: 'admin',
    }).catch((err) => console.error('[Email] Welcome email failed:', err.message));

    // Return without password
    const { password: _, ...safe } = adminDoc; // eslint-disable-line no-unused-vars
    safe.managedUserCount = 0;
    res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/superadmin/admins/:id
 * Updates an admin account's details (not password).
 */
export async function updateAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, username, role, team, maxUsers } = req.body;

    const db = getDB();
    const admin = await db.collection('users').findOne({ id, accountRole: 'admin' });

    if (!admin) {
      return res.status(404).json({ error: 'Admin account not found.' });
    }

    // Check for duplicate username/email (excluding self)
    if (username || email) {
      const orConditions = [];
      if (username) orConditions.push({ username: username.trim().toLowerCase() });
      if (email) orConditions.push({ email: email.trim().toLowerCase() });

      const duplicate = await db.collection('users').findOne({
        $or: orConditions,
        id: { $ne: id },
      });

      if (duplicate) {
        return res.status(409).json({
          error: 'Another account already uses this username or email.',
        });
      }
    }

    const updateDoc = {};
    if (name) updateDoc.name = name.trim();
    if (email) updateDoc.email = email.trim().toLowerCase();
    if (username) updateDoc.username = username.trim().toLowerCase();
    if (role) updateDoc.role = role.trim();
    if (team !== undefined) updateDoc.team = team;
    if (maxUsers !== undefined) updateDoc.maxUsers = parseInt(maxUsers) || 25;

    if (name) {
      updateDoc.avatar = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    }

    await db.collection('users').updateOne({ id }, { $set: updateDoc });
    await logActivity(`Super Admin updated admin '${name || admin.name}'`, 'superadmin');

    const updated = await db.collection('users').findOne({ id });
    const { password: _, ...safe } = updated; // eslint-disable-line no-unused-vars
    safe.managedUserCount = await db.collection('users')
      .countDocuments({ managedBy: id, accountRole: 'user' });

    res.json(safe);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/superadmin/admins/:id
 * Permanently deletes an admin account. Reassigns their managed users.
 */
export async function deleteAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDB();

    const admin = await db.collection('users').findOne({ id, accountRole: 'admin' });
    if (!admin) {
      return res.status(404).json({ error: 'Admin account not found.' });
    }

    // Prevent deleting if admin still has managed users
    const managedCount = await db.collection('users')
      .countDocuments({ managedBy: id, accountRole: 'user' });

    if (managedCount > 0) {
      return res.status(400).json({
        error: `Cannot delete — ${managedCount} user(s) are still managed by this admin. Reassign or remove them first.`,
      });
    }

    await db.collection('users').deleteOne({ id });
    await logActivity(`Super Admin deleted admin account '${admin.name}'`, 'superadmin');
    await writeAuditLog({
      event: AuditEvent.USER_DELETED,
      userId: id,
      actorId: req.user.id,
      actorName: req.user.name,
      metadata: { accountRole: 'admin', name: admin.name },
      req,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER MANAGEMENT (All users across all admins)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/superadmin/users
 * Lists all user accounts (team members who have credentials).
 */
export async function listAllUsers(req, res, next) {
  try {
    const db = getDB();
    const users = await db.collection('users')
      .find({ accountRole: 'user' })
      .project({ password: 0 })
      .toArray();

    // Attach managing admin name for each user
    const adminIds = [...new Set(users.map(u => u.managedBy).filter(Boolean))];
    const admins = adminIds.length > 0
      ? await db.collection('users').find({ id: { $in: adminIds } }).project({ id: 1, name: 1 }).toArray()
      : [];
    const adminMap = Object.fromEntries(admins.map(a => [a.id, a.name]));

    for (const user of users) {
      user.managedByName = adminMap[user.managedBy] || 'Unassigned';
    }

    res.json(users);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED ACTIONS (Work on any admin or user account)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * PUT /api/superadmin/admins/:id/reset-password
 * PUT /api/superadmin/users/:id/reset-password
 * PUT /api/superadmin/reset-password/:id (legacy)
 * Resets an admin or user's password. Accepts the new password in plain text,
 * hashes it server-side with SHA-256.
 */
export async function resetPassword(req, res, next) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required.' });
    }

    const db = getDB();
    const account = await db.collection('users').findOne({
      id,
      accountRole: { $in: ['admin', 'user'] },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    await db.collection('users').updateOne(
      { id },
      { $set: { password: await hashPasswordForStorage(newPassword) } }
    );

    await logActivity(`Super Admin reset password for '${account.name}'`, 'superadmin');
    await writeAuditLog({
      event: AuditEvent.PASSWORD_RESET,
      userId: id,
      actorId: req.user.id,
      actorName: req.user.name,
      metadata: { initiatedBy: 'superadmin' },
      req,
    });

    sendAdminPasswordResetEmail({
      name: account.name,
      email: account.email,
      username: account.username || account.email,
      newPassword,
    }).catch((err) => console.error('[Email] Admin reset email failed:', err.message));

    res.json({ success: true, message: `Password reset for ${account.name}.` });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/superadmin/admins/:id/status
 * PUT /api/superadmin/users/:id/status
 * PUT /api/superadmin/toggle-status/:id (legacy)
 * Toggles an account's status between 'active' and 'inactive'.
 */
export async function toggleStatus(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDB();

    const account = await db.collection('users').findOne({
      id,
      accountRole: { $in: ['admin', 'user'] },
    });

    if (!account) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    const newStatus = account.status === 'active' ? 'inactive' : 'active';

    await db.collection('users').updateOne(
      { id },
      { $set: { status: newStatus } }
    );

    await logActivity(`Super Admin set '${account.name}' to ${newStatus}`, 'superadmin');
    res.json({ success: true, status: newStatus });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/superadmin/audit-logs
 * Returns platform-wide activity events for Super Admin oversight.
 */
export async function getAuditLogs(req, res, next) {
  try {
    const db = getDB();
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

    const activities = await db
      .collection('activities')
      .find({})
      .sort({ createdAt: -1, id: -1 })
      .limit(limit)
      .toArray();

    const ownerIds = [
      ...new Set(
        activities
          .map((a) => a.ownerId)
          .filter((id) => id && id !== 'superadmin')
      ),
    ];

    const admins = ownerIds.length > 0
      ? await db.collection('users')
        .find({ id: { $in: ownerIds } })
        .project({ id: 1, name: 1 })
        .toArray()
      : [];

    const adminMap = Object.fromEntries(admins.map((a) => [a.id, a.name]));

    const logs = activities.map((act) => ({
      id: act.id,
      text: act.text,
      timestamp: act.timestamp,
      createdAt: act.createdAt,
      ownerId: act.ownerId,
      workspace: act.ownerId === 'superadmin'
        ? 'Super Admin'
        : (adminMap[act.ownerId] || 'Unknown workspace'),
    }));

    res.json(logs);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/superadmin/audit-logs
 * Clears platform audit logs by date range (?range=all|last-week|last-month).
 */
export async function clearAuditLogs(req, res, next) {
  try {
    const { range } = req.query;
    const db = getDB();

    let query = {};
    const now = new Date();

    if (range === 'last-week') {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: cutoff };
    } else if (range === 'last-month') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: cutoff };
    } else if (range === 'all') {
      // delete all matching documents
    } else {
      return res.status(400).json({
        error: "Invalid range parameter. Use 'all', 'last-week', or 'last-month'.",
      });
    }

    const result = await db.collection('activities').deleteMany(query);
    await logActivity(`Super Admin cleared audit logs (range: ${range})`, 'superadmin');

    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    next(err);
  }
}
