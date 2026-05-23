/**
 * @file server.js
 * @description Application entry point.
 *
 * Responsibilities (only):
 *  1. Load environment variables
 *  2. Connect to MongoDB
 *  3. Seed the database (on first run)
 *  4. Start the HTTP server with Socket.io
 *
 * All application logic lives in backend/app.js and its modules.
 */
import 'dotenv/config';
import http from 'http';
import app                from './backend/app.js';
import { connectDB }      from './backend/config/db.js';
import { seedDatabase }   from './backend/seed/seeder.js';
import { getDB }          from './backend/config/db.js';
import { initSocket }     from './backend/config/socket.js';
import { isCloudinaryConfigured } from './backend/services/cloudinary.service.js';
import { ensureAuthIndexes } from './backend/models/indexes.js';

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    await ensureAuthIndexes(getDB());
    await seedDatabase(getDB());

    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`[Server] ✅ Running on http://localhost:${PORT}`);
      console.log(
        `[Server] Assets: ${isCloudinaryConfigured() ? 'Cloudinary' : 'local /uploads (set CLOUDINARY_URL to enable Cloudinary)'}`
      );
    });
  } catch (err) {
    console.error('[Server] ❌ Failed to start:', err.message);
    process.exit(1);
  }
}

start();
