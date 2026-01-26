/**
 * Storage Utility Functions
 */
export class StorageUtils {
  /**
   * Format bytes into a human-readable string (e.g., 1.2 GB)
   */
  static formatSize(bytes: bigint | number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let size = Number(bytes);
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    // Fixed 1 decimal place for GB and above, otherwise 0
    const decimals = unitIndex >= 3 ? 1 : 0;
    return `${size.toFixed(decimals)} ${units[unitIndex]}`;
  }
}
