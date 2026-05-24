/**
 * @file mongoose.js
 * @description Mongoose connection for RBAC entities.
 */
import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

let connected = false;

/**
 * @returns {Promise<typeof mongoose>}
 */
export async function connectMongoose() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/task_management';
  if (connected && mongoose.connection.readyState === 1) {
    return mongoose;
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  connected = true;
  logger.info('Mongoose connected for RBAC models');
  return mongoose;
}

export async function disconnectMongoose() {
  if (connected) {
    await mongoose.disconnect();
    connected = false;
  }
}

export { mongoose };
