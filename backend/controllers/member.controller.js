/**
 * @file member.controller.js
 * @description Business logic for workspace member management.
 * Exports: getAllMembers, addMember, removeMember, bulkDeleteMembers,
 *          toggleMemberStatus, setMemberCredentials
 */
import { getDB } from '../config/db.js';
import { hashPasswordForStorage } from '../services/auth.service.js';
import { generateCompliantPassword, hashPassword } from '../services/password.service.js';
import { logActivity } from '../utils/activity.util.js';
import { sendWelcomeEmail, sendAdminPasswordResetEmail } from '../services/email.service.js';

/**
 * GET /api/members
 * Returns workspace directory members.
 * Admins see only users they manage (managedBy matches their id).
 * Super admins see all members.
 */
export async function getAllMembers(req, res, next) {
  try {
    const db = getDB();
    let query = { accountRole: 'user' };

    // Admins only see their own managed users
    if (req.user.accountRole === 'admin') {
      query.managedBy = req.user.id;
    }

    const members = await db.collection('users')
      .find(query)
      .project({ password: 0 })
      .toArray();

    res.json(members);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/members
 * Adds a new member to the workspace directory.
 * Enforces maxUsers limit for admin accounts.
 */
export async function addMember(req, res, next) {
  try {
    const { name, email, role, team, username, password: rawPassword } = req.body;

    if (!name || !email || !role || !team) {
      return res.status(400).json({ error: 'Name, email, role, and team are all required.' });
    }

    const db = getDB();

    // Enforce maxUsers limit for admin accounts
    if (req.user.accountRole === 'admin' && req.user.maxUsers) {
      const currentCount = await db.collection('users')
        .countDocuments({ managedBy: req.user.id, accountRole: 'user' });

      if (currentCount >= req.user.maxUsers) {
        return res.status(400).json({
          error: `User limit reached (${currentCount}/${req.user.maxUsers}). Contact your Super Admin to increase the limit.`,
        });
      }
    }

    // Check for duplicate email or username
    const emailLower = email.trim().toLowerCase();
    const orConditions = [{ email: emailLower }];
    const cleanUsername = username ? username.trim().toLowerCase() : null;

    if (cleanUsername) {
      orConditions.push({ username: cleanUsername });
    }

    const existing = await db.collection('users').findOne({ $or: orConditions });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email or username already exists.' });
    }

    const id = 'member-' + Date.now();

    // Auto-generate default credentials if not provided
    const autoUsername = cleanUsername || name.trim().split(' ')[0].toLowerCase();
    const plainPassword = rawPassword || generateCompliantPassword();
    const autoPassword = rawPassword
      ? await hashPasswordForStorage(plainPassword)
      : await hashPassword(plainPassword);

    const memberDoc = {
      id,
      name: name.trim(),
      email: emailLower,
      username: autoUsername,
      password: autoPassword,
      role: role.trim(),
      team,
      accountRole: 'user',
      status: 'active',
      managedBy: req.user.id,
      avatar: name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      bio: '',
    };

    await db.collection('users').insertOne(memberDoc);
    await logActivity(`${req.user.name} added member '${name}' to team '${team}'`);

    sendWelcomeEmail({
      name: memberDoc.name,
      email: memberDoc.email,
      username: autoUsername,
      password: plainPassword,
      accountRole: 'user',
    }).catch((err) => console.error('[Email] Welcome email failed:', err.message));

    // Return without password
    const { password: _, ...safe } = memberDoc; // eslint-disable-line no-unused-vars
    res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/members/:id
 * Removes a single member. Unassigns all their active tasks.
 */
export async function removeMember(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDB();

    const member = await db.collection('users').findOne({ id });
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    // Admins can only remove their own managed users
    if (req.user.accountRole === 'admin' && member.managedBy !== req.user.id) {
      return res.status(403).json({ error: 'You can only manage your own team members.' });
    }

    // Unassign tasks belonging to this member before removing
    await db.collection('tasks').updateMany(
      { assigneeId: id },
      { $set: { assigneeId: null } }
    );

    await db.collection('users').deleteOne({ id });
    await logActivity(`${req.user.name} removed member '${member.name}' from the workspace`);

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/members/bulk-delete
 * Removes multiple members at once by their IDs. Unassigns all their tasks.
 */
export async function bulkDeleteMembers(req, res, next) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'A non-empty array of member IDs is required.' });
    }

    const db = getDB();

    // Build query — admins can only delete their own managed users
    const query = { id: { $in: ids } };
    if (req.user.accountRole === 'admin') {
      query.managedBy = req.user.id;
    }

    const membersToDelete = await db.collection('users')
      .find(query)
      .toArray();

    if (membersToDelete.length === 0) {
      return res.status(404).json({ error: 'No matching members found.' });
    }

    const deletableIds = membersToDelete.map(m => m.id);

    // Unassign tasks for all members being removed
    await db.collection('tasks').updateMany(
      { assigneeId: { $in: deletableIds } },
      { $set: { assigneeId: null } }
    );

    await db.collection('users').deleteMany({ id: { $in: deletableIds } });

    const names = membersToDelete.map((m) => m.name).join(', ');
    await logActivity(`${req.user.name} removed members: ${names}`);

    res.json({ success: true, removed: membersToDelete.length });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/members/:id/status
 * Toggles a member's account status between 'active' and 'inactive'.
 */
export async function toggleMemberStatus(req, res, next) {
  try {
    const { id } = req.params;
    const db = getDB();

    const member = await db.collection('users').findOne({ id, accountRole: 'user' });
    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    // Admins can only toggle their own managed users
    if (req.user.accountRole === 'admin' && member.managedBy !== req.user.id) {
      return res.status(403).json({ error: 'You can only manage your own team members.' });
    }

    const newStatus = member.status === 'active' ? 'inactive' : 'active';
    await db.collection('users').updateOne({ id }, { $set: { status: newStatus } });

    await logActivity(`${req.user.name} set '${member.name}' to ${newStatus}`);
    res.json({ success: true, status: newStatus });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/members/:id/credentials
 * Sets or resets a member's username and/or password.
 */
export async function setMemberCredentials(req, res, next) {
  try {
    const { id } = req.params;
    const { username, password: rawPassword } = req.body;

    if (!username && !rawPassword) {
      return res.status(400).json({ error: 'Provide at least a username or password.' });
    }

    const db = getDB();
    const member = await db.collection('users').findOne({ id, accountRole: 'user' });

    if (!member) {
      return res.status(404).json({ error: 'Member not found.' });
    }

    // Admins can only manage their own users
    if (req.user.accountRole === 'admin' && member.managedBy !== req.user.id) {
      return res.status(403).json({ error: 'You can only manage your own team members.' });
    }

    const updateDoc = {};

    if (username) {
      const cleanUsername = username.trim().toLowerCase();
      // Check for duplicate username
      const duplicate = await db.collection('users').findOne({
        username: cleanUsername,
        id: { $ne: id },
      });
      if (duplicate) {
        return res.status(409).json({ error: 'This username is already taken.' });
      }
      updateDoc.username = cleanUsername;
    }

    if (rawPassword) {
      updateDoc.password = await hashPasswordForStorage(rawPassword);
    }

    await db.collection('users').updateOne({ id }, { $set: updateDoc });
    await logActivity(`${req.user.name} updated credentials for '${member.name}'`);

    if (rawPassword) {
      sendAdminPasswordResetEmail({
        name: member.name,
        email: member.email,
        username: updateDoc.username || member.username || member.email,
        newPassword: rawPassword,
      }).catch((err) => console.error('[Email] Credential reset email failed:', err.message));
    }

    res.json({ success: true, message: `Credentials updated for ${member.name}.` });
  } catch (err) {
    next(err);
  }
}
