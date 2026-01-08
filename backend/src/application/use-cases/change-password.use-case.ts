/**
 * Change Password Use Case
 * 
 * Allows authenticated users to change their password.
 * Requires current password + TOTP verification.
 * Increments tokenVersion to invalidate all existing sessions.
 */

import { IUserRepository } from '../interfaces/user-repository.interface';
import { IEmailService } from '../interfaces/email-service.interface';
import { PasswordService } from '../../infrastructure/services/password.service';
import { AuditLogService } from '../../infrastructure/services/audit-log.service';
import { TotpService } from '../../infrastructure/services/totp.service';
import { Password } from '../../domain/value-objects/password';

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
  totpCode: string;
}

export class ChangePasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private auditLogService: AuditLogService,
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
    // 1. Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 2. Check if user is active
    if (!user.isUserActive()) {
      throw new Error('Account is inactive');
    }

    // 3. Verify current password
    const isCurrentPasswordValid = await PasswordService.verifyPassword(
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

    // 4. Verify TOTP (MANDATORY for password change)
    if (!user.totpSecret) {
      throw new Error('TOTP is required for password change');
    }

    const encryptionKey = process.env.TOTP_ENCRYPTION_KEY || 'default-key-change-in-production';
    let totpSecret: string;
    try {
      totpSecret = TotpService.decryptSecret(user.totpSecret, encryptionKey);
    } catch {
      throw new Error('Invalid TOTP configuration');
    }

    const isTotpValid = TotpService.verifyTotp(dto.totpCode, totpSecret);
    if (!isTotpValid) {
      await this.auditLogService.logPasswordChange(user.id, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        success: false,
        errorMessage: 'Invalid TOTP code',
      });
      throw new Error('Invalid TOTP code');
    }

    // 5. Validate new password
    const newPassword = new Password(dto.newPassword);

    // 6. Check if new password is different from current
    const isSamePassword = await PasswordService.verifyPassword(
      dto.newPassword,
      user.passwordHash
    );
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    // 7. Hash new password
    const passwordHash = await PasswordService.hashPassword(newPassword.getValue());

    // 8. Update password and increment tokenVersion (invalidates all existing tokens)
    await this.userRepository.update(user.id, {
      passwordHash,
      tokenVersion: user.tokenVersion + 1, // Invalidate all existing sessions
    });

    // 9. Log successful password change
    await this.auditLogService.logPasswordChange(user.id, {
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success: true,
    });

    // 10. Send password change notification email (non-blocking)
    try {
      await this.emailService.sendPasswordChangeNotification(
        user.email,
        user.firstName,
        options?.ipAddress,
        options?.userAgent
      );
    } catch (error) {
      // Log error but don't fail password change
      console.error('Failed to send password change notification:', error);
    }
  }
}
