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
import { getDB }          from './backend/config/db.js';
import { initSocket }     from './backend/config/socket.js';
import { isCloudinaryConfigured } from './backend/services/cloudinary.service.js';
import { ensureAuthIndexes } from './backend/models/indexes.js';
import { connectMongoose } from './backend/config/mongoose.js';
import { ensureRbacIndexes } from './backend/models/index.js';
import { seedRbac } from './backend/seed/rbac.seed.js';

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await connectDB();
    await connectMongoose();
    await ensureAuthIndexes(getDB());
    await ensureRbacIndexes();
    await seedRbac();

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
