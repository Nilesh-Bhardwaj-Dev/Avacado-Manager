/** True when the value is a displayable image URL or data URI (not initials text). */
export function isImageSrc(src) {
  if (!src || typeof src !== 'string') return false;
  if (src.startsWith('data:image')) return true;
  return /^https?:\/\//i.test(src);
}

/** Resolves relative upload paths for the dev proxy; leaves absolute URLs unchanged. */
export function resolveAssetUrl(url) {
  if (!url) return url;
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return url;
}
