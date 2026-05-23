/**
 * @file notification.controller.js
 * @description Notification CRUD operations.
 */
import { getDB } from '../config/db.js';

export async function getNotifications(req, res, next) {
  try {
    const db = getDB();
    const notifications = await db.collection('notifications')
      .find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();
    res.json(notifications);
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const db = getDB();
    await db.collection('notifications').updateOne(
      { id: req.params.id, recipientId: req.user.id },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    const db = getDB();
    await db.collection('notifications').updateMany(
      { recipientId: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function getUnreadCount(req, res, next) {
  try {
    const db = getDB();
    const count = await db.collection('notifications').countDocuments({
      recipientId: req.user.id,
      read: false
    });
    res.json({ count });
  } catch (err) {
    next(err);
  }
}
