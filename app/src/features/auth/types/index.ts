export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isTwoFactorEnabled: boolean;
  storageQuota?: string;
  storageUsed?: string;
  storagePercentage?: number;
}

export * from './dtos';
