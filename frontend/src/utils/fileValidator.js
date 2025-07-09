// Supported image file types
const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/bmp',
  'image/gif'
];

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_BATCH_SIZE = 1000; // Maximum files in batch

/**
 * Validate single file type and size
 * @param {File} file - File to validate
 * @returns {Object} - Validation result with isValid and error
 */
export const validateFile = (file) => {
  if (!file) {
    return { isValid: false, error: 'No file provided' };
  }

  // Check file type
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return { 
      isValid: false, 
      error: `Unsupported file type: ${file.type}. Supported types: JPEG, PNG, WEBP, BMP, GIF` 
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      isValid: false, 
      error: `File size too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB` 
    };
  }

  return { isValid: true, error: null };
};

/**
 * Validate multiple files
 * @param {FileList|File[]} files - Files to validate
 * @returns {Object} - Validation result with isValid, error, and validFiles
 */
export const validateFiles = (files) => {
  const fileArray = Array.from(files);
  
  if (fileArray.length === 0) {
    return { isValid: false, error: 'No files provided', validFiles: [] };
  }

  // Check batch size limit
  if (fileArray.length > MAX_BATCH_SIZE) {
    return { 
      isValid: false, 
      error: `Too many files: ${fileArray.length}. Maximum: ${MAX_BATCH_SIZE}`, 
      validFiles: [] 
    };
  }

  const validFiles = [];
  const errors = [];

  fileArray.forEach((file, index) => {
    const validation = validateFile(file);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
    }
  });

  if (errors.length > 0) {
    return { 
      isValid: false, 
      error: errors.join('\n'), 
      validFiles 
    };
  }

  return { isValid: true, error: null, validFiles };
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {Object} - Validation result with isValid and error
 */
export const validateUrl = (url) => {
  if (!url || !url.trim()) {
    return { isValid: false, error: 'URL is required' };
  }

  try {
    new URL(url.trim());
    return { isValid: true, error: null };
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }
};

/**
 * Validate multiple URLs
 * @param {string} urlString - Newline-separated URLs
 * @returns {Object} - Validation result with isValid, error, and validUrls
 */
export const validateUrls = (urlString) => {
  if (!urlString || !urlString.trim()) {
    return { isValid: false, error: 'URLs are required', validUrls: [] };
  }

  const urls = urlString.split('\n').filter(url => url.trim());
  
  if (urls.length === 0) {
    return { isValid: false, error: 'No valid URLs provided', validUrls: [] };
  }

  if (urls.length > MAX_BATCH_SIZE) {
    return { 
      isValid: false, 
      error: `Too many URLs: ${urls.length}. Maximum: ${MAX_BATCH_SIZE}`, 
      validUrls: [] 
    };
  }

  const validUrls = [];
  const errors = [];

  urls.forEach((url, index) => {
    const validation = validateUrl(url);
    if (validation.isValid) {
      validUrls.push(url.trim());
    } else {
      errors.push(`URL ${index + 1}: ${validation.error}`);
    }
  });

  if (errors.length > 0) {
    return { 
      isValid: false, 
      error: errors.join('\n'), 
      validUrls 
    };
  }

  return { isValid: true, error: null, validUrls };
};