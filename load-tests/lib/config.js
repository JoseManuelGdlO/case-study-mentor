/**
 * @param {string} [path]
 * @returns {string}
 */
export function getBaseUrl() {
  const raw = __ENV.BASE_URL || 'http://localhost:3001';
  return raw.replace(/\/$/, '');
}

/**
 * @param {string} path
 * @returns {string}
 */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${getBaseUrl()}${p}`;
}
