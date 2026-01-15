/**
 * Regenerate Backup Codes Use Case
 * 
 * Allows authenticated users to regenerate TOTP backup codes.
 * Requires password + TOTP verification for security.
 */

import { IUserRepository } from '../interfaces/user-repository.interface.js';
import { ITotpBackupCodeRepository } from '../interfaces/totp-backup-code-repository.interface.js';
import { IPasswordService } from '../interfaces/password-service.interface.js';
import { ITotpService } from '../interfaces/totp-service.interface.js';
import { IAuditLogService } from '../interfaces/audit-log-service.interface.js';
import { getTotpEncryptionKey } from '../../infrastructure/config/env-validator.js';

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
    private passwordService: IPasswordService,
    private totpService: ITotpService,
    private auditLogService: IAuditLogService
  ) {}

  async execute(
    userId: string,
    dto: RegenerateBackupCodesDTO,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<RegenerateBackupCodesResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isUserActive()) {
      throw new Error('Account is inactive');
    }

    if (!user.totpSecret) {
      throw new Error('TOTP is not enabled for this account');
    }

    const isPasswordValid = await this.passwordService.verifyPassword(
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

    const encryptionKey = getTotpEncryptionKey();
    let totpSecret: string;
    try {
      totpSecret = this.totpService.decryptSecret(user.totpSecret, encryptionKey);
    } catch {
      throw new Error('Invalid TOTP configuration');
    }

    const isTotpValid = this.totpService.verifyTotp(dto.totpCode, totpSecret);
    if (!isTotpValid) {
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

    const newBackupCodes = this.totpService.generateBackupCodes(10);

    const hashedBackupCodes = await Promise.all(
      newBackupCodes.map(async (code) => {
        return await this.passwordService.hashPassword(code);
      })
    );

    await this.totpBackupCodeRepository.deleteAllForUser(user.id);
    await this.totpBackupCodeRepository.createCodes(user.id, hashedBackupCodes);

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
