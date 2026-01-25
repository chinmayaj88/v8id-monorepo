/**
 * Thumbnail Service Interface
 * 
 * Defines contract for thumbnail generation services.
 */

export interface ThumbnailGenerationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export interface ThumbnailGenerationResult {
  thumbnailBuffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface IThumbnailService {
  /**
   * Generate thumbnail for an image
   */
  generateImageThumbnail(
    imageBuffer: Buffer,
    options?: ThumbnailGenerationOptions
  ): Promise<ThumbnailGenerationResult>;

  /**
   * Check if a file type supports thumbnail generation
   */
  supportsThumbnail(mimeType: string): boolean;

  /**
   * Get optimal thumbnail dimensions for a file type
   */
  getOptimalDimensions(mimeType: string): { width: number; height: number };
}


