export interface IAccountLockoutService {
  isAccountLocked(userId: string): Promise<{ locked: boolean; unlockAt?: Date }>;

  getFailedAttemptCount(userId: string): Promise<number>;

  resetFailedAttempts(userId: string): Promise<void>;
}
