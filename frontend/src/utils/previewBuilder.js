/**
 * Create preview URL from file
 * @param {File} file - File object
 * @returns {string} - Object URL for preview
 */
export const createFilePreview = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Create preview objects for multiple files
 * @param {File[]} files - Array of File objects
 * @returns {Array} - Array of preview objects with url and name
 */
export const createFilePreviews = (files) => {
  return files.map(file => ({
    url: URL.createObjectURL(file),
    name: file.name
  }));
};

/**
 * Create preview objects from URLs
 * @param {string} urlString - Newline-separated URLs
 * @returns {Array} - Array of preview objects with url
 */
export const createUrlPreviews = (urlString) => {
  const urls = urlString.split('\n').filter(url => url.trim());
  return urls.map(url => ({ url: url.trim() }));
};

/**
 * Cleanup preview URLs to prevent memory leaks
 * @param {Array} previews - Array of preview objects
 */
export const cleanupPreviews = (previews) => {
  previews.forEach(preview => {
    if (preview.url && preview.url.startsWith('blob:')) {
      URL.revokeObjectURL(preview.url);
    }
  });
};

/**
 * Cleanup single preview URL
 * @param {string} previewUrl - Preview URL to cleanup
 */
export const cleanupPreview = (previewUrl) => {
  if (previewUrl && previewUrl.startsWith('blob:')) {
    URL.revokeObjectURL(previewUrl);
  }
};