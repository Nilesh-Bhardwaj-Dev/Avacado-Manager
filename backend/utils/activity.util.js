/**
 * @file activity.util.js
 * @description Shared utility for logging workspace activity events.
 * Eliminates repetitive inline insertOne calls across controllers.
 */
import { getDB } from '../config/db.js';

/**
 * Inserts a new activity record into the activities collection.
 * @param {string} text - Human-readable description of the action.
 */
export async function logActivity(text, ownerId = null) {
  const db = getDB();
  await db.collection('activities').insertOne({
    id: 'act-' + Date.now(),
    text,
    timestamp: 'Just now',
    createdAt: new Date(),
    ownerId,
  });
}
