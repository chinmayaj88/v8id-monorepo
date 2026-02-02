/**
 * Global BigInt Serialization Fix
 *
 * Prisma uses BigInt for numeric types that map to 64-bit integers in the DB.
 * The standard JSON.stringify does not support BigInt.
 * This patch adds a toJSON method to BigInt.prototype to serialize properly as string.
 */

// Check if property is already defined to avoid conflicts/errors
if (!Object.prototype.hasOwnProperty.call(BigInt.prototype, 'toJSON')) {
  Object.defineProperty(BigInt.prototype, 'toJSON', {
    value: function () {
      return this.toString();
    },
    writable: true,
    configurable: true,
  });
}
