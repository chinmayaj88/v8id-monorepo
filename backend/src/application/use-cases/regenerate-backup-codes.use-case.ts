/**
 * Regenerate Backup Codes Use Case
 * 
 * Allows authenticated users to regenerate TOTP backup codes.
 * Requires password + TOTP verification for security.
 */

import { IUserRepository } from '../interfaces/user-repository.interface';
import { ITotpBackupCodeRepository } from '../interfaces/totp-backup-code-repository.interface';
import { PasswordService } from '../../infrastructure/services/password.service';
import { TotpService } from '../../infrastructure/services/totp.service';
import { AuditLogService } from '../../infrastructure/services/audit-log.service';

export interface RegenerateBackupCodesDTO {
  password: string;
  totpCode: string;
}

export interface RegenerateBackupCodesResult {
  backupCodes: string[];
}

export class RegenerateBackupCodesUseCase {
  constructor(
    private userRepository: IUserRepository,
    private totpBackupCodeRepository: ITotpBackupCodeRepository,
    private auditLogService: AuditLogService
  ) {}

  async execute(
    userId: string,
    dto: RegenerateBackupCodesDTO,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<RegenerateBackupCodesResult> {
    // 1. Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 2. Check if user is active
    if (!user.isUserActive()) {
      throw new Error('Account is inactive');
    }

    // 3. Verify TOTP is enabled
    if (!user.totpSecret) {
      throw new Error('TOTP is not enabled for this account');
    }

    // 4. Verify password
    const isPasswordValid = await PasswordService.verifyPassword(
      dto.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      await this.auditLogService.logEvent({
        userId: user.id,
        eventType: 'BACKUP_CODES_REGENERATE_ATTEMPT',
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        success: false,
        errorMessage: 'Invalid password',
      });
      throw new Error('Invalid password');
    }

    // 5. Verify TOTP code
    const encryptionKey = process.env.TOTP_ENCRYPTION_KEY || 'default-key-change-in-production';
    let totpSecret: string;
    try {
      totpSecret = TotpService.decryptSecret(user.totpSecret, encryptionKey);
    } catch {
      throw new Error('Invalid TOTP configuration');
    }

    const isTotpValid = TotpService.verifyTotp(dto.totpCode, totpSecret);
    if (!isTotpValid) {
      // Also check backup codes (user might be using a backup code to regenerate)
      const isBackupCodeValid = await this.totpBackupCodeRepository.verifyAndUseCode(
        userId,
        dto.totpCode
      );
      if (!isBackupCodeValid) {
        await this.auditLogService.logEvent({
          userId: user.id,
          eventType: 'BACKUP_CODES_REGENERATE_ATTEMPT',
          ipAddress: options?.ipAddress,
          userAgent: options?.userAgent,
          success: false,
          errorMessage: 'Invalid TOTP code',
        });
        throw new Error('Invalid TOTP code');
      }
    }

    // 6. Generate new backup codes
    const newBackupCodes = TotpService.generateBackupCodes(10);

    // 7. Hash backup codes for storage
    const hashedBackupCodes = await Promise.all(
      newBackupCodes.map(async (code) => {
        return await PasswordService.hashPassword(code);
      })
    );

    // 8. Delete old backup codes and create new ones
    await this.totpBackupCodeRepository.deleteAllForUser(user.id);
    await this.totpBackupCodeRepository.createCodes(user.id, hashedBackupCodes);

    // 9. Log successful regeneration
    await this.auditLogService.logEvent({
      userId: user.id,
      eventType: 'BACKUP_CODES_REGENERATED',
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success: true,
    });

    return {
      backupCodes: newBackupCodes,
    };
  }
}
