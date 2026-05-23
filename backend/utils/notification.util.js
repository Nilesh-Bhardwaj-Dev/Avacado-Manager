/**
 * @file notification.util.js
 * @description Central notification emitter — inserts into DB and pushes via Socket.io.
 */
import { getDB } from '../config/db.js';
import { getIO } from '../config/socket.js';

/**
 * Send a notification to a specific user.
 * @param {Object} opts
 * @param {string} opts.type - TASK_ASSIGNED | TASK_UPDATED | TASK_COMPLETED | COMMENT_ADDED | DEPENDENCY_UNBLOCKED | TASK_OVERDUE
 * @param {string} opts.recipientId - user id to send to
 * @param {string} opts.title - notification title
 * @param {string} opts.message - notification message body
 * @param {string} [opts.taskId] - related task id
 * @param {string} [opts.ownerId] - workspace owner id
 */
export async function sendNotification({ type, recipientId, title, message, taskId = null, ownerId = null }) {
  try {
    const db = getDB();
    const notification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
      type,
      recipientId,
      title,
      message,
      taskId,
      ownerId,
      read: false,
      createdAt: new Date(),
    };

    await db.collection('notifications').insertOne(notification);

    // Emit to the recipient's socket room
    const io = getIO();
    if (io) {
      io.to(recipientId).emit('notification', notification);
    }

    return notification;
  } catch (err) {
    console.error('[Notification] Failed to send:', err.message);
  }
}
