/**
 * @file profile.controller.js
 * @description Controller for managing the user profile (name, bio, avatar/photo) and changing password.
 */
import { getDB } from '../config/db.js';
import { sessions } from '../middleware/auth.middleware.js';
import { logActivity } from '../utils/activity.util.js';
import { sendPasswordChangedEmail } from '../services/email.service.js';
import { parseBase64Payload, isImageMime } from '../utils/base64.util.js';
import { storeAsset } from '../utils/asset-storage.util.js';

/**
 * GET /api/profile
 * Returns the currently authenticated user's profile details.
 */
export async function getProfile(req, res, next) {
  try {
    const db = getDB();
    const user = await db.collection('users').findOne({ id: req.user.id });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      team: user.team,
      avatar: user.avatar,
      bio: user.bio || '',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/profile
 * Updates the user's name, bio, and avatar/photo.
 */
export async function updateProfile(req, res, next) {
  try {
    const { name, bio, avatar } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required.' });
    }

    const db = getDB();
    const updateDoc = {
      name: name.trim(),
      bio: (bio || '').trim(),
    };

    if (avatar !== undefined) {
      if (typeof avatar === 'string' && avatar.startsWith('data:')) {
        const { buffer, mimeType } = parseBase64Payload(avatar);
        if (!isImageMime(mimeType)) {
          return res.status(400).json({ error: 'Avatar must be an image file.' });
        }
        const stored = await storeAsset({
          buffer,
          fileName: 'avatar.jpg',
          mimeType,
          folder: 'avatars',
          localPrefix: 'avatar-',
        });
        updateDoc.avatar = stored.url;
      } else {
        updateDoc.avatar = avatar;
      }
    }

    const result = await db.collection('users').findOneAndUpdate(
      { id: req.user.id },
      { $set: updateDoc },
      { returnDocument: 'after' }
    );

    const updatedUser = result;
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Synchronize the active session mapping
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (sessions[token]) {
        sessions[token].name = updatedUser.name;
        sessions[token].bio = updatedUser.bio || '';
        if (updatedUser.avatar !== undefined) {
          sessions[token].avatar = updatedUser.avatar;
        }
      }
    }

    const ownerId = req.user.accountRole === 'admin' ? req.user.id : req.user.managedBy;
    await logActivity(`${updatedUser.name} updated their workspace profile`, ownerId);

    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      team: updatedUser.team,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio || '',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/profile/password
 * Changes the user's password (plain text over HTTPS; hashed server-side with Argon2).
 */
export async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }

    const { changePassword } = await import('../services/auth.service.js');
    const result = await changePassword(req.user.id, currentPassword, newPassword, req);

    sendPasswordChangedEmail({ name: req.user.name, email: req.user.email }).catch((err) =>
      console.error('[Email] Password changed notification failed:', err.message)
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
}
