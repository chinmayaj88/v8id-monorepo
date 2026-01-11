/**
 * Change Password Use Case
 * 
 * Allows authenticated users to change their password.
 * Requires current password + TOTP verification.
 * Increments tokenVersion to invalidate all existing sessions.
 */

import { IUserRepository } from '../interfaces/user-repository.interface';
import { IEmailService } from '../interfaces/email-service.interface';
import { IPasswordService } from '../interfaces/password-service.interface';
import { IAuditLogService } from '../interfaces/audit-log-service.interface';
import { ITotpService } from '../interfaces/totp-service.interface';
import { Password } from '../../domain/value-objects/password';

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  totpCode: string;
}

export class ChangePasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private passwordService: IPasswordService,
    private totpService: ITotpService,
    private auditLogService: IAuditLogService,
    private emailService: IEmailService
  ) {}

  async execute(
    userId: string,
    dto: ChangePasswordDTO,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isUserActive()) {
      throw new Error('Account is inactive');
    }

    const isCurrentPasswordValid = await this.passwordService.verifyPassword(
      dto.currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      await this.auditLogService.logPasswordChange(user.id, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        success: false,
        errorMessage: 'Invalid current password',
      });
      throw new Error('Invalid current password');
    }

    if (!user.totpSecret) {
      throw new Error('TOTP is required for password change');
    }

    const encryptionKey = process.env.TOTP_ENCRYPTION_KEY || 'default-key-change-in-production';
    let totpSecret: string;
    try {
      totpSecret = this.totpService.decryptSecret(user.totpSecret, encryptionKey);
    } catch {
      throw new Error('Invalid TOTP configuration');
    }

    const isTotpValid = this.totpService.verifyTotp(dto.totpCode, totpSecret);
    if (!isTotpValid) {
      await this.auditLogService.logPasswordChange(user.id, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        success: false,
        errorMessage: 'Invalid TOTP code',
      });
      throw new Error('Invalid TOTP code');
    }

    const newPassword = new Password(dto.newPassword);

    const isSamePassword = await this.passwordService.verifyPassword(
      dto.newPassword,
      user.passwordHash
    );
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    const passwordHash = await this.passwordService.hashPassword(newPassword.getValue());

    await this.userRepository.update(user.id, {
      passwordHash,
      tokenVersion: user.tokenVersion + 1,
    });

    await this.auditLogService.logPasswordChange(user.id, {
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success: true,
    });

    try {
      await this.emailService.sendPasswordChangeNotification(
        user.email,
        user.firstName,
        options?.ipAddress,
        options?.userAgent
      );
    } catch (error) {
      console.error('Failed to send password change notification:', error);
    }
  }
}
