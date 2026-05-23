/**
 * Cloudinary uploads for task proofs, avatars, and other image assets.
 */
import { Readable } from 'stream';
import { v2 as cloudinary } from 'cloudinary';

let configured = false;

function configureCloudinary() {
  if (configured) return;

  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true });
  } else if (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  configured = true;
}

export function isCloudinaryConfigured() {
  configureCloudinary();
  return Boolean(cloudinary.config().cloud_name);
}

/**
 * Upload a file buffer to Cloudinary.
 * @param {object} options
 * @param {Buffer} options.buffer
 * @param {string} [options.folder] - Cloudinary folder (e.g. proofs, avatars)
 * @param {string} [options.fileName] - Used to build a stable public_id suffix
 * @param {string} [options.mimeType]
 * @returns {Promise<{ url: string, publicId: string, resourceType: string }>}
 */
export async function uploadAssetBuffer({ buffer, folder = 'assets', fileName = 'file', mimeType }) {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured. Set CLOUDINARY_URL or CLOUDINARY_* env vars.');
  }

  const resourceType = mimeType?.startsWith('image/') ? 'image' : 'auto';
  const safeName = fileName.replace(/[^\w.-]+/g, '_').slice(0, 80);
  const publicId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;

  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: resourceType,
      },
      (error, uploadResult) => {
        if (error) reject(error);
        else resolve(uploadResult);
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
  };
}
