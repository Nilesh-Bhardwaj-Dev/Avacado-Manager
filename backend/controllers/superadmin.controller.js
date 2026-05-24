/**
 * @file superadmin.controller.js
 * @description Business logic for Super Admin management operations.
 */
import { getDB } from '../config/db.js';
import { hashPassword } from '../services/password.service.js';
import { AuditEvent, writeAuditLog } from '../services/audit.service.js';
import { logActivity } from '../utils/activity.util.js';
import { sendWelcomeEmail, sendAdminPasswordResetEmail } from '../services/email.service.js';
import { createOrganization } from '../services/organization.service.js';
import { clearRoleCache } from '../services/rbac.service.js';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_ORG_ADMIN_PERMISSIONS = [
  'create_project', 'edit_project', 'delete_project',
  'create_task', 'edit_task', 'delete_task', 'assign_task',
  'invite_user', 'manage_roles', 'export_reports', 'view_reports',
  'manage_organization', 'manage_billing', 'view_audit_logs',
];

/**
 * Creates or updates a custom permission role for an org admin.
 * Returns the role id.
 */
async function upsertOrgAdminRole(db, { organizationId, userId, permissionKeys, existingRoleId }) {
  const perms = Array.isArray(permissionKeys) && permissionKeys.length
    ? permissionKeys
    : DEFAULT_ORG_ADMIN_PERMISSIONS;

  if (existingRoleId) {
    const existing = await db.collection('roles').findOne({ id: existingRoleId });
    if (existing && !existing.isSystem) {
      await db.collection('roles').updateOne(
        { id: existingRoleId },
        { $set: { permissionKeys: perms, updatedAt: new Date() } }
      );
      clearRoleCache();
      return existingRoleId;
    }
  }

  // Create a new custom role
  const customRoleId = `role-${userId}-${Date.now()}`;
  await db.collection('roles').insertOne({
    id: customRoleId,
    key: `custom_org_admin_${userId}`,
    name: 'Org Admin (Custom)',
    scope: 'organization',
    organizationId,
    isSystem: false,
    inheritsFromRoleId: null,
    permissionKeys: perms,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  clearRoleCache();
  return customRoleId;
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────────────────────

export async function getDashboardStats(req, res, next) {
  try {
    const db = getDB();
    const users = db.collection('users');

    const [totalAdmins, totalUsers, activeAccounts, inactiveAccounts, totalOrgs] = await Promise.all([
      users.countDocuments({ accountRole: 'admin' }),
      users.countDocuments({ accountRole: 'user' }),
      users.countDocuments({ status: 'active', accountRole: { $ne: 'superadmin' } }),
      users.countDocuments({ status: 'inactive' }),
      db.collection('organizations').countDocuments({}),
    ]);

    res.json({ totalAdmins, totalUsers, activeAccounts, inactiveAccounts, totalOrgs });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ORG ADMIN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/superadmin/admins
 * Lists all admin accounts with their permissions and org details.
 */
export async function listAdmins(req, res, next) {
  try {
    const db = getDB();
    const admins = await db.collection('users')
      .find({ accountRole: 'admin' })
      .project({ password: 0 })
      .toArray();

    for (const admin of admins) {
      admin.managedUserCount = await db.collection('organization_memberships')
        .countDocuments({ organizationId: { $exists: true } });

      const membership = await db.collection('organization_memberships').findOne({ userId: admin.id });
      if (membership) {
        admin.organizationId = membership.organizationId;
        const org = await db.collection('organizations').findOne({ id: membership.organizationId });
        admin.organizationName = org ? org.name : null;

        const role = await db.collection('roles').findOne({ id: membership.roleId });
        if (role) {
          admin.systemRoleKey = role.key;
          admin.permissions = role.permissionKeys || [];
          admin.roleId = role.id;
        } else {
          admin.systemRoleKey = 'org_admin';
          admin.permissions = DEFAULT_ORG_ADMIN_PERMISSIONS;
          admin.roleId = null;
        }
      } else {
        admin.organizationId = null;
        admin.organizationName = null;
        admin.systemRoleKey = null;
        admin.permissions = [];
        admin.roleId = null;
      }

      // Count members in this admin's org
      if (admin.organizationId) {
        admin.managedUserCount = await db.collection('organization_memberships')
          .countDocuments({ organizationId: admin.organizationId });
      } else {
        admin.managedUserCount = 0;
      }
    }

    res.json(admins);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/superadmin/admins
 * Creates a new Organization Admin account with an Organization and custom permissions.
 */
export async function createAdmin(req, res, next) {
  try {
    const { name, email, username, password, maxUsers, permissions, organizationName } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ error: 'Name, email, username, and password are required.' });
    }

    const db = getDB();

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

    const id = `user-${Date.now()}`;
    const adminDoc = {
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      password: await hashPassword(password),
      role: 'Organization Admin',
      team: null,
      accountRole: 'admin',
      status: 'active',
      maxUsers: parseInt(maxUsers) || 25,
      managedBy: null,
      avatar: name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      bio: '',
    };

    await db.collection('users').insertOne(adminDoc);

    // Create Organization
    const orgName = organizationName?.trim() || `${name.trim()}'s Organization`;
    const { organization, defaultProject } = await createOrganization({
      name: orgName,
      createdBy: id,
    });

    // Create custom role with the specified permissions
    const perms = Array.isArray(permissions) && permissions.length
      ? permissions
      : DEFAULT_ORG_ADMIN_PERMISSIONS;

    const customRoleId = await upsertOrgAdminRole(db, {
      organizationId: organization.id,
      userId: id,
      permissionKeys: perms,
      existingRoleId: null,
    });

    // Update the org membership to use the custom role
    await db.collection('organization_memberships').updateOne(
      { organizationId: organization.id, userId: id },
      { $set: { roleId: customRoleId } }
    );

    // Also update project membership
    if (defaultProject) {
      await db.collection('project_memberships').updateOne(
        { organizationId: organization.id, userId: id },
        { $set: { roleId: customRoleId } }
      );
    }

    await logActivity(`Super Admin created org admin account '${name}'`, 'superadmin');
    await writeAuditLog({
      event: AuditEvent.USER_CREATED,
      userId: id,
      actorId: req.user.id,
      actorName: req.user.name,
      metadata: { accountRole: 'admin', email: adminDoc.email, organizationId: organization.id },
      req,
    });

    sendWelcomeEmail({
      name: adminDoc.name,
      email: adminDoc.email,
      username: adminDoc.username,
      password,
      accountRole: 'admin',
    }).catch(err => console.error('[Email] Welcome email failed:', err.message));

    const safe = { ...adminDoc };
    delete safe.password;
    safe.managedUserCount = 0;
    safe.organizationId = organization.id;
    safe.organizationName = organization.name;
    safe.permissions = perms;
    res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/superadmin/admins/:id
 * Updates an admin's details and/or permissions.
 */
export async function updateAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const { name, email, username, maxUsers, permissions } = req.body;

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
        return res.status(409).json({ error: 'Another account already uses this username or email.' });
      }
    }

    const updateDoc = {};
    if (name) updateDoc.name = name.trim();
    if (email) updateDoc.email = email.trim().toLowerCase();
    if (username) updateDoc.username = username.trim().toLowerCase();
    if (maxUsers !== undefined) updateDoc.maxUsers = parseInt(maxUsers) || 25;
    if (name) updateDoc.avatar = name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    await db.collection('users').updateOne({ id }, { $set: updateDoc });

    // Update permissions if provided
    if (Array.isArray(permissions)) {
      const membership = await db.collection('organization_memberships').findOne({ userId: id });
      if (membership) {
        const newRoleId = await upsertOrgAdminRole(db, {
          organizationId: membership.organizationId,
          userId: id,
          permissionKeys: permissions,
          existingRoleId: membership.roleId,
        });

        if (newRoleId !== membership.roleId) {
          await db.collection('organization_memberships').updateOne(
            { organizationId: membership.organizationId, userId: id },
            { $set: { roleId: newRoleId } }
          );
          await db.collection('project_memberships').updateMany(
            { organizationId: membership.organizationId, userId: id },
            { $set: { roleId: newRoleId } }
          );
        }
      }
    }

    await logActivity(`Super Admin updated admin '${name || admin.name}'`, 'superadmin');

    const updated = await db.collection('users').findOne({ id }, { projection: { password: 0 } });
    const membership = await db.collection('organization_memberships').findOne({ userId: id });
    if (membership) {
      updated.organizationId = membership.organizationId;
      const org = await db.collection('organizations').findOne({ id: membership.organizationId });
      updated.organizationName = org ? org.name : null;
      const role = await db.collection('roles').findOne({ id: membership.roleId });
      updated.permissions = role ? role.permissionKeys || [] : [];
      updated.managedUserCount = await db.collection('organization_memberships')
        .countDocuments({ organizationId: membership.organizationId });
    } else {
      updated.managedUserCount = 0;
      updated.permissions = [];
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/superadmin/admins/:id
 */
export async function deleteAdmin(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDB();

    const admin = await db.collection('users').findOne({ id, accountRole: 'admin' });
    if (!admin) {
      return res.status(404).json({ error: 'Admin account not found.' });
    }

    await db.collection('users').deleteOne({ id });
    await db.collection('organization_memberships').deleteMany({ userId: id });
    await db.collection('project_memberships').deleteMany({ userId: id });

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

/**
 * PUT /api/superadmin/admins/:id/permissions
 * Only updates the permissions for an admin (quick permission toggle).
 */
export async function updateAdminPermissions(req, res, next) {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'permissions must be an array.' });
    }

    const db = getDB();
    const admin = await db.collection('users').findOne({ id, accountRole: 'admin' });
    if (!admin) return res.status(404).json({ error: 'Admin not found.' });

    const membership = await db.collection('organization_memberships').findOne({ userId: id });
    if (!membership) return res.status(404).json({ error: 'Admin has no organization membership.' });

    const newRoleId = await upsertOrgAdminRole(db, {
      organizationId: membership.organizationId,
      userId: id,
      permissionKeys: permissions,
      existingRoleId: membership.roleId,
    });

    if (newRoleId !== membership.roleId) {
      await db.collection('organization_memberships').updateOne(
        { organizationId: membership.organizationId, userId: id },
        { $set: { roleId: newRoleId } }
      );
      await db.collection('project_memberships').updateMany(
        { organizationId: membership.organizationId, userId: id },
        { $set: { roleId: newRoleId } }
      );
    }

    await logActivity(`Super Admin updated permissions for admin '${admin.name}'`, 'superadmin');
    res.json({ success: true, permissions });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function listAllUsers(req, res, next) {
  try {
    const db = getDB();
    const users = await db.collection('users')
      .find({ accountRole: { $ne: 'superadmin' } })
      .project({ password: 0 })
      .toArray();

    for (const user of users) {
      const membership = await db.collection('organization_memberships').findOne({ userId: user.id });
      if (membership) {
        const org = await db.collection('organizations').findOne({ id: membership.organizationId });
        user.organizationName = org ? org.name : null;
        user.organizationId = membership.organizationId;
        const role = await db.collection('roles').findOne({ id: membership.roleId });
        user.systemRole = role ? role.name : null;
        user.permissions = role ? role.permissionKeys || [] : [];
      } else {
        user.organizationName = null;
        user.organizationId = null;
        user.systemRole = null;
        user.permissions = [];
      }
    }

    res.json(users);
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

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
      { $set: { password: await hashPassword(newPassword) } }
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
    }).catch(err => console.error('[Email] Admin reset email failed:', err.message));

    res.json({ success: true, message: `Password reset for ${account.name}.` });
  } catch (err) {
    next(err);
  }
}

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
    await db.collection('users').updateOne({ id }, { $set: { status: newStatus } });

    await logActivity(`Super Admin set '${account.name}' to ${newStatus}`, 'superadmin');
    res.json({ success: true, status: newStatus });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────────

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
        activities.map(a => a.ownerId).filter(id => id && id !== 'superadmin')
      ),
    ];

    const admins = ownerIds.length > 0
      ? await db.collection('users').find({ id: { $in: ownerIds } }).project({ id: 1, name: 1 }).toArray()
      : [];

    const adminMap = Object.fromEntries(admins.map(a => [a.id, a.name]));

    const logs = activities.map(act => ({
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
      // delete all
    } else {
      return res.status(400).json({ error: "Invalid range. Use 'all', 'last-week', or 'last-month'." });
    }

    const result = await db.collection('activities').deleteMany(query);
    await logActivity(`Super Admin cleared audit logs (range: ${range})`, 'superadmin');

    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    next(err);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ORGANIZATIONS
// ─────────────────────────────────────────────────────────────────────────────

export async function listOrganizations(req, res, next) {
  try {
    const db = getDB();
    const orgs = await db.collection('organizations').find({}).toArray();

    for (const org of orgs) {
      if (org.createdBy) {
        const owner = await db.collection('users').findOne({ id: org.createdBy }, { projection: { password: 0 } });
        if (owner) {
          org.ownerName = owner.name;
          org.ownerEmail = owner.email;
          org.maxUsers = owner.maxUsers || 25;
        } else {
          org.ownerName = 'Unknown';
          org.maxUsers = 25;
        }
      } else {
        org.ownerName = 'System';
        org.maxUsers = 25;
      }

      org.userCount = await db.collection('organization_memberships').countDocuments({ organizationId: org.id });
      org.projectCount = await db.collection('projects').countDocuments({ organizationId: org.id });
    }

    res.json(orgs);
  } catch (err) {
    next(err);
  }
}

export async function listOrganizationUsers(req, res, next) {
  try {
    const { orgId } = req.params;
    const db = getDB();

    const memberships = await db.collection('organization_memberships').find({ organizationId: orgId }).toArray();
    const userIds = memberships.map(m => m.userId);

    const users = await db.collection('users')
      .find({ id: { $in: userIds } })
      .project({ password: 0 })
      .toArray();

    const allRoles = await db.collection('roles').find({
      $or: [{ organizationId: orgId }, { organizationId: null, isSystem: true }]
    }).toArray();
    const roleMap = Object.fromEntries(allRoles.map(r => [r.id, r]));

    const formatted = memberships.map(m => {
      const u = users.find(user => user.id === m.userId);
      if (!u) return null;
      const role = roleMap[m.roleId];
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        username: u.username,
        role: role ? role.name : u.role || 'Member',
        systemRoleKey: role ? role.key : null,
        permissions: role ? role.permissionKeys || [] : [],
        status: u.status,
        accountRole: u.accountRole,
        avatar: u.avatar || '',
        maxUsers: u.maxUsers || null,
        membershipStatus: m.status,
      };
    }).filter(Boolean);

    res.json(formatted);
  } catch (err) {
    next(err);
  }
}

export async function toggleOrganizationStatus(req, res, next) {
  try {
    const { orgId } = req.params;
    const db = getDB();

    const org = await db.collection('organizations').findOne({ id: orgId });
    if (!org) {
      return res.status(404).json({ error: 'Organization not found.' });
    }

    const newStatus = org.status === 'active' ? 'suspended' : 'active';
    await db.collection('organizations').updateOne({ id: orgId }, { $set: { status: newStatus } });

    await logActivity(`Super Admin set organization '${org.name}' status to ${newStatus}`, 'superadmin');
    res.json({ success: true, status: newStatus });
  } catch (err) {
    next(err);
  }
}
