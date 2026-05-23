/**
 * @file socket.js
 * @description Socket.io with JWT authentication (cookie or handshake token).
 */
import { Server } from 'socket.io';
import cookie from 'cookie';
import { authConfig } from './auth.config.js';
import { verifyAccessToken } from '../services/token.service.js';
import { getDB } from './db.js';
import { Collections } from '../constants/collections.js';
import { sanitizeUser } from '../services/session.service.js';

let io = null;

/**
 * @param {import('socket.io').Socket} socket
 * @returns {string|null}
 */
function extractTokenFromSocket(socket) {
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }
  const rawCookie = socket.handshake.headers?.cookie;
  if (rawCookie) {
    const parsed = cookie.parse(rawCookie);
    return parsed[authConfig.cookies.accessName] || null;
  }
  return null;
}

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: authConfig.cors.origin,
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = extractTokenFromSocket(socket);

      if (!token) return next(new Error('Authentication required'));

      const payload = verifyAccessToken(token);
      if (!payload?.sub) return next(new Error('Invalid token'));

      const db = getDB();
      const user = await db.collection(Collections.USERS).findOne({ id: payload.sub });
      if (!user || user.status === 'inactive') {
        return next(new Error('Account inactive'));
      }

      socket.user = sanitizeUser(user);
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(socket.user.id);
    console.log(`[Socket] User ${socket.user.name} connected (${socket.user.id})`);

    socket.on('disconnect', () => {
      console.log(`[Socket] User ${socket.user.name} disconnected`);
    });
  });

  return io;
}

export function getIO() {
  return io;
}
