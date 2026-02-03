/**
 * Thumbnail Service Implementation
 *
 * Generates thumbnails for images using Sharp library.
 * Optimized for performance with proper error handling.
 */

import sharp from 'sharp';
import {
  IThumbnailService,
  ThumbnailGenerationOptions,
  ThumbnailGenerationResult,
} from '../../application/interfaces/thumbnail-service.interface.js';

// Standard thumbnail sizes for different use cases
const THUMBNAIL_SIZES = {
  small: { width: 150, height: 150 }, // Gallery grid thumbnails
  medium: { width: 300, height: 300 }, // Preview thumbnails
  large: { width: 800, height: 800 }, // Full preview
} as const;

export class ThumbnailService implements IThumbnailService {
  /**
   * Generate thumbnail for an image
   * Optimized with proper aspect ratio preservation and quality settings
   */
  async generateImageThumbnail(
    imageBuffer: Buffer,
    options: ThumbnailGenerationOptions = {}
  ): Promise<ThumbnailGenerationResult> {
    try {
      const {
        width = THUMBNAIL_SIZES.medium.width,
        height = THUMBNAIL_SIZES.medium.height,
        quality = 85,
      } = options;

      // Create sharp instance
      let sharpInstance = sharp(imageBuffer);

      // Get image metadata to preserve aspect ratio
      const metadata = await sharpInstance.metadata();
      const originalWidth = metadata.width || width;
      const originalHeight = metadata.height || height;
      const aspectRatio = originalWidth / originalHeight;

      // Calculate optimal dimensions maintaining aspect ratio
      let finalWidth = width;
      let finalHeight = height;

      if (aspectRatio > 1) {
        // Landscape: fit to width
        finalHeight = Math.round(width / aspectRatio);
      } else {
        // Portrait or square: fit to height
        finalWidth = Math.round(height * aspectRatio);
      }

      // Generate thumbnail with optimization
      const thumbnailBuffer = await sharpInstance
        .resize(finalWidth, finalHeight, {
          fit: 'inside', // Maintain aspect ratio, fit within dimensions
          withoutEnlargement: true, // Don't upscale small images
        })
        .jpeg({
          quality,
          mozjpeg: true, // Better compression
          progressive: true, // Progressive JPEG for better perceived performance
        })
        .toBuffer();

      // Free sharp instance memory immediately
      sharpInstance = null as any;

      return {
        thumbnailBuffer,
        width: finalWidth,
        height: finalHeight,
        format: 'jpeg',
        size: thumbnailBuffer.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate thumbnail: ${errorMessage}`);
    }
  }

  /**
   * Check if a file type supports thumbnail generation
   */
  supportsThumbnail(mimeType: string): boolean {
    // Support common image formats
    const supportedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'image/svg+xml', // Note: SVG thumbnails may need special handling
    ];

    return supportedTypes.some(type => mimeType.toLowerCase().startsWith(type.split('/')[0] + '/'));
  }

  /**
   * Get optimal thumbnail dimensions for a file type
   */
  getOptimalDimensions(_mimeType: string): { width: number; height: number } {
    // For now, use medium size for all images
    // Can be customized based on file type in the future
    return THUMBNAIL_SIZES.medium;
  }

  /**
   * Generate multiple thumbnail sizes (for future optimization)
   */
  async generateMultipleSizes(
    imageBuffer: Buffer,
    sizes: Array<{ width: number; height: number }> = [
      THUMBNAIL_SIZES.small,
      THUMBNAIL_SIZES.medium,
      THUMBNAIL_SIZES.large,
    ]
  ): Promise<Map<string, ThumbnailGenerationResult>> {
    const results = new Map<string, ThumbnailGenerationResult>();

    for (const size of sizes) {
      const sizeKey = `${size.width}x${size.height}`;
      try {
        const result = await this.generateImageThumbnail(imageBuffer, {
          width: size.width,
          height: size.height,
        });
        results.set(sizeKey, result);
      } catch (error) {
        // Failed to generate thumbnail size - continue with other sizes
        // Continue with other sizes
      }
    }

    return results;
  }

  /**
   * Get the file type category for default thumbnail assignment
   */
  categorizeFileType(
    mimeType: string
  ): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'code' | 'other' {
    const type = mimeType.toLowerCase();

    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('audio/')) return 'audio';

    // Documents
    if (
      type.includes('pdf') ||
      type.includes('word') ||
      type.includes('document') ||
      type.includes('spreadsheet') ||
      type.includes('excel') ||
      type.includes('presentation') ||
      type.includes('powerpoint') ||
      type.startsWith('text/')
    ) {
      return 'document';
    }

    // Archives
    if (
      type.includes('zip') ||
      type.includes('rar') ||
      type.includes('tar') ||
      type.includes('gzip') ||
      type.includes('7z') ||
      type.includes('archive') ||
      type.includes('compressed')
    ) {
      return 'archive';
    }

    // Code files
    if (
      type.includes('javascript') ||
      type.includes('typescript') ||
      type.includes('json') ||
      type.includes('xml') ||
      type.includes('html') ||
      type.includes('css')
    ) {
      return 'code';
    }

    return 'other';
  }

  /**
   * Get default thumbnail identifier for file types that don't support thumbnail generation
   * Returns a category that the frontend can use to display appropriate icons
   */
  getDefaultThumbnailCategory(mimeType: string): string {
    return this.categorizeFileType(mimeType);
  }

  /**
   * Check if we should attempt thumbnail generation for this file type
   * Images: yes, Videos: no (skip), Others: no (use default)
   */
  shouldGenerateThumbnail(mimeType: string): boolean {
    const category = this.categorizeFileType(mimeType);
    return category === 'image' && this.supportsThumbnail(mimeType);
  }
}
