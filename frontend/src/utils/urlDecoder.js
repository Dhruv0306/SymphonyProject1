// utils/urlDecoder.js
export function decodeUrl(url) {
  try {
    return decodeURIComponent(url);
  } catch (error) {
    console.error('Failed to decode URL:', url, error);
    return url; // fallback
  }
}