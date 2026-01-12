import imageCompression from 'browser-image-compression';

/**
 * Compress image files before upload
 * @param {File} file - Image file to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = async (file, options = {}) => {
  try {
    const defaultOptions = {
      maxSizeMB: 1, // Maximum file size in MB
      maxWidthOrHeight: 1920, // Maximum width or height
      useWebWorker: true, // Use web worker for better performance
      fileType: file.type, // Keep original file type
      initialQuality: 0.8, // Initial compression quality (0-1)
      ...options
    };

    // Don't compress if file is already small
    if (file.size <= defaultOptions.maxSizeMB * 1024 * 1024) {
      return file;
    }

    console.log(`Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    const compressedFile = await imageCompression(file, defaultOptions);

    console.log(`Compressed image: ${file.name} (${(compressedFile.size / 1024 / 1024).toFixed(2)}MB)`);

    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original file if compression fails
    return file;
  }
};

/**
 * Compress multiple image files
 * @param {File[]} files - Array of image files to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File[]>} - Array of compressed image files
 */
export const compressImages = async (files, options = {}) => {
  const compressionPromises = files.map(file => compressImage(file, options));
  return Promise.all(compressionPromises);
};

/**
 * Get optimal compression settings based on image type and intended use
 * @param {string} imageType - Type of image (property, avatar, logo, etc.)
 * @param {string} fileType - MIME type of the file
 * @returns {Object} - Optimized compression options
 */
export const getCompressionOptions = (imageType, fileType) => {
  const baseOptions = {
    useWebWorker: true,
    fileType: fileType,
  };

  switch (imageType) {
    case 'avatar':
    case 'logo':
      return {
        ...baseOptions,
        maxSizeMB: 0.5,
        maxWidthOrHeight: 400,
        initialQuality: 0.9
      };

    case 'property':
      return {
        ...baseOptions,
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        initialQuality: 0.8
      };

    case 'document':
      return {
        ...baseOptions,
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        initialQuality: 0.7
      };

    default:
      return {
        ...baseOptions,
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        initialQuality: 0.8
      };
  }
};

/**
 * Validate image file before compression
 * @param {File} file - File to validate
 * @param {Object} constraints - Validation constraints
 * @returns {Object} - Validation result
 */
export const validateImageFile = (file, constraints = {}) => {
  const {
    maxSizeBytes = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  } = constraints;

  const errors = [];

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Check file size
  if (file.size > maxSizeBytes) {
    errors.push(`File size too large. Maximum size: ${(maxSizeBytes / 1024 / 1024).toFixed(1)}MB`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Create a preview URL for an image file
 * @param {File} file - Image file
 * @returns {string} - Preview URL
 */
export const createImagePreview = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Revoke a preview URL to free memory
 * @param {string} url - Preview URL to revoke
 */
export const revokeImagePreview = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

export default {
  compressImage,
  compressImages,
  getCompressionOptions,
  validateImageFile,
  createImagePreview,
  revokeImagePreview
};