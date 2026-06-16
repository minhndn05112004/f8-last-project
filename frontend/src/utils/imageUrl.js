/**
 * Returns the full URL for an image path.
 *
 * - If path is already an absolute URL (starts with http/https), return as-is.
 *   This covers Cloudinary URLs (https://res.cloudinary.com/...) and any
 *   external images.
 * - If path is a relative path (e.g. /uploads/products/...), prefix it with
 *   VITE_API_URL so it works on both localhost and the deployed backend.
 * - If path is null/undefined/empty, return the provided fallback.
 */
const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://f8-last-project.onrender.com';

export const getImageUrl = (path, fallback = '') => {
  if (!path) return fallback;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Relative path — prepend backend origin
  return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
