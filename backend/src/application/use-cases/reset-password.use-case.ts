/**
 * Reset Password Use Case
 * 
 * Validates reset token and updates user password.
 * Increments tokenVersion to invalidate all existing sessions.
 */

import { IUserRepository } from '../interfaces/user-repository.interface';
import { IPasswordService } from '../interfaces/password-service.interface';
import { IAuditLogService } from '../interfaces/audit-log-service.interface';
import { Password } from '../../domain/value-objects/password';

export class ResetPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordService: IPasswordService,
    private auditLogService: IAuditLogService
  ) {}

  async execute(
    token: string,
    newPassword: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    // 1. Validate password
    const password = new Password(newPassword);

    // 2. Find user by reset token (token must be valid and not expired)
    const user = await this.userRepository.findByPasswordResetToken(token);
    if (!user) {
      await this.auditLogService.logPasswordResetComplete(undefined, false, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        errorMessage: 'Invalid or expired reset token',
      });
      throw new Error('Invalid or expired reset token');
    }

    // 3. Check if user is active
    if (!user.isUserActive()) {
      await this.auditLogService.logPasswordResetComplete(user.id, false, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        errorMessage: 'Account is inactive',
      });
      throw new Error('Account is inactive');
    }

    // 4. Hash new password
    const passwordHash = await this.passwordService.hashPassword(password.getValue());

    // 5. Update password and increment tokenVersion (invalidates all existing tokens)
    // Also clear reset token to prevent reuse
    await this.userRepository.update(user.id, {
      passwordHash,
      tokenVersion: user.tokenVersion + 1, // Invalidate all existing sessions
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    // 6. Log successful password reset
    await this.auditLogService.logPasswordResetComplete(user.id, true, {
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });

    // 7. Log password change event
    await this.auditLogService.logPasswordChange(user.id, {
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });
  }
}
