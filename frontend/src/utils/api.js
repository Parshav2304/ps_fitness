/**
 * Production API Helper Utility
 * Prevents URL duplication (e.g. /api/api), formats auth headers, and handles errors safely.
 */

export const getApiUrl = (baseUrl, path) => {
  let cleanedBase = (baseUrl || 'http://localhost:8000').replace(/\/+$/, '');
  let cleanedPath = (path || '').replace(/^\/+/, '');

  if (cleanedBase.endsWith('/api') && cleanedPath.startsWith('api/')) {
    cleanedPath = cleanedPath.replace(/^api\//, '');
  } else if (!cleanedBase.endsWith('/api') && !cleanedPath.startsWith('api/')) {
    cleanedPath = `api/${cleanedPath}`;
  }

  return `${cleanedBase}/${cleanedPath}`;
};

export const apiFetch = async (baseUrl, path, options = {}) => {
  const url = getApiUrl(baseUrl, path);
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  return response;
};
