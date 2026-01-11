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
    const password = new Password(newPassword);

    const user = await this.userRepository.findByPasswordResetToken(token);
    if (!user) {
      await this.auditLogService.logPasswordResetComplete(undefined, false, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        errorMessage: 'Invalid or expired reset token',
      });
      throw new Error('Invalid or expired reset token');
    }

    if (!user.isUserActive()) {
      await this.auditLogService.logPasswordResetComplete(user.id, false, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        errorMessage: 'Account is inactive',
      });
      throw new Error('Account is inactive');
    }

    const passwordHash = await this.passwordService.hashPassword(password.getValue());

    await this.userRepository.update(user.id, {
      passwordHash,
      tokenVersion: user.tokenVersion + 1,
      passwordResetToken: null,
      passwordResetExpires: null,
    });

    await this.auditLogService.logPasswordResetComplete(user.id, true, {
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });

    await this.auditLogService.logPasswordChange(user.id, {
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });
  }
}
