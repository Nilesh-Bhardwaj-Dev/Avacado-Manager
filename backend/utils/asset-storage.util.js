/**
 * Stores uploaded assets on Cloudinary when configured, otherwise on local disk.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadAssetBuffer, isCloudinaryConfigured } from '../services/cloudinary.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * @param {object} options
 * @param {Buffer} options.buffer
 * @param {string} options.fileName
 * @param {string} [options.mimeType]
 * @param {string} options.folder - Cloudinary folder or local subfolder prefix
 * @param {string} options.localPrefix - Filename prefix for disk storage (e.g. proof-, avatar-)
 */
export async function storeAsset({ buffer, fileName, mimeType, folder, localPrefix }) {
  if (isCloudinaryConfigured()) {
    const uploaded = await uploadAssetBuffer({ buffer, fileName, mimeType, folder });
    return { url: uploaded.url, storage: 'cloudinary', publicId: uploaded.publicId };
  }

  ensureUploadsDir();
  const uniqueFileName = `${localPrefix}${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${fileName}`;
  const filePath = path.join(UPLOADS_DIR, uniqueFileName);
  fs.writeFileSync(filePath, buffer);

  return { url: `/uploads/${uniqueFileName}`, storage: 'local' };
}
