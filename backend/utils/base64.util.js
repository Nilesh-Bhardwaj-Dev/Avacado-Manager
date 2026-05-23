/**
 * Parses a base64 payload (with or without a data-URI prefix) into a buffer and MIME type.
 */
export function parseBase64Payload(base64, fallbackMime = 'application/octet-stream') {
  const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
  if (matches) {
    return {
      buffer: Buffer.from(matches[2], 'base64'),
      mimeType: matches[1],
    };
  }
  return {
    buffer: Buffer.from(base64, 'base64'),
    mimeType: fallbackMime,
  };
}

export function isImageMime(mimeType) {
  return typeof mimeType === 'string' && mimeType.startsWith('image/');
}
