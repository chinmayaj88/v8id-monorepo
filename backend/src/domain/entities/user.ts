/**
 * User Entity
 * 
 * Represents a user in the system with business logic.
 * This is a pure domain entity with no external dependencies.
 */

import { UserRole } from './user-role';

export class User {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly avatarUrl?: string,
    public readonly emailVerified: boolean = true,
    public readonly storageQuota: bigint = BigInt(10737418240), // 10GB default
    public readonly storageUsed: bigint = BigInt(0),
    public readonly isActive: boolean = true,
    public readonly totpSecret?: string,
    public readonly totpVerified: boolean = false,
    public readonly lastLoginAt?: Date,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  /**
   * Check if user is an admin
   */
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  /**
   * Check if user can create other users (only admins can)
   */
  canCreateUsers(): boolean {
    return this.isAdmin();
  }

  /**
   * Check if user has TOTP enabled and verified
   * TOTP is mandatory - if totpSecret exists, TOTP is enabled
   */
  hasTotpEnabled(): boolean {
    return !!this.totpSecret && this.totpVerified;
  }

  /**
   * Check if TOTP is set up (secret exists)
   * TOTP is mandatory for all users
   */
  hasTotpSecret(): boolean {
    return !!this.totpSecret;
  }

  /**
   * Check if user is active
   */
  isUserActive(): boolean {
    return this.isActive;
  }

  /**
   * Get user's full name
   */
  getFullName(): string {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    if (this.firstName) {
      return this.firstName;
    }
    if (this.lastName) {
      return this.lastName;
    }
    return this.email;
  }

  /**
   * Get storage usage percentage
   */
  getStorageUsagePercentage(): number {
    if (this.storageQuota === BigInt(0)) {
      return 0;
    }
    return Number((this.storageUsed * BigInt(100)) / this.storageQuota);
  }

  /**
   * Check if user has exceeded storage quota
   */
  hasExceededStorageQuota(): boolean {
    return this.storageUsed >= this.storageQuota;
  }

  /**
   * Get available storage space
   */
  getAvailableStorage(): bigint {
    const available = this.storageQuota - this.storageUsed;
    return available > BigInt(0) ? available : BigInt(0);
  }
}

