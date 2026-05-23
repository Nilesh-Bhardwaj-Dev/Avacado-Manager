/**
 * @file db.js
 * @description MongoDB connection singleton.
 * Exports connectDB() to establish connection and getDB() to access the db instance.
 */
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('[DB] MONGODB_URI is not set in environment variables.');
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
let db;

/**
 * Connects to MongoDB. Must be called once at application startup.
 */
export async function connectDB() {
  await client.connect();
  db = client.db();
  console.log('[DB] Connected to MongoDB Atlas');
}

/**
 * Returns the connected database instance.
 * Throws if connectDB() has not been called yet.
 */
export function getDB() {
  if (!db) {
    throw new Error('[DB] Database not initialized. Call connectDB() before using getDB().');
  }
  return db;
}

/**
 * Gracefully closes the MongoDB connection.
 */
export async function closeDB() {
  await client.close();
  console.log('[DB] MongoDB connection closed.');
}
