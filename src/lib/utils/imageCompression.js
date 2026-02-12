/**
 * Image Compression Utilities
 *
 * Client-side image compression using Canvas API
 * Resizes and converts images to WebP/JPEG format
 */

/**
 * Compress an image file
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width in pixels
 * @param {number} maxHeight - Maximum height in pixels
 * @param {number} quality - Compression quality (0-1)
 * @returns {Promise<Blob>} Compressed image blob
 */
export async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Try WebP first (better compression)
          canvas.toBlob(
            (blob) => {
              if (blob) {
                console.log(`✅ Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB`);
                resolve(blob);
              } else {
                // Fallback to JPEG if WebP fails
                canvas.toBlob(
                  (jpegBlob) => {
                    if (jpegBlob) {
                      console.log(`✅ Image compressed (JPEG): ${(file.size / 1024).toFixed(1)}KB → ${(jpegBlob.size / 1024).toFixed(1)}KB`);
                      resolve(jpegBlob);
                    } else {
                      reject(new Error('Failed to compress image'));
                    }
                  },
                  'image/jpeg',
                  quality
                );
              }
            },
            'image/webp',
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Check if file is a valid image
 * @param {File} file - File to check
 * @returns {boolean} True if file is an image
 */
export function isValidImage(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return file && validTypes.includes(file.type);
}

/**
 * Get image dimensions without loading full image
 * @param {File} file - Image file
 * @returns {Promise<{width: number, height: number}>} Image dimensions
 */
export async function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Convert blob to data URL for preview
 * @param {Blob} blob - Image blob
 * @returns {Promise<string>} Data URL
 */
export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read blob'));
    };

    reader.readAsDataURL(blob);
  });
}

/**
 * Estimate compressed image size
 * @param {File} file - Image file
 * @returns {Promise<number>} Estimated size in bytes
 */
export async function estimateCompressedSize(file) {
  try {
    const compressed = await compressImage(file);
    return compressed.size;
  } catch (error) {
    console.error('Failed to estimate size:', error);
    return file.size; // Return original size if estimation fails
  }
}
