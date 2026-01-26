export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  isTwoFactorEnabled: boolean;
}

export * from './dtos';
