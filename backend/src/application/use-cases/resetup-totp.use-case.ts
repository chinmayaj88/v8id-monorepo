/**
 * Resetup TOTP Use Case
 * 
 * Allows authenticated users to re-setup TOTP if they lose access to their authenticator.
 * Requires password verification for security.
 * This will invalidate the old TOTP secret and generate a new one.
 */

import { IUserRepository } from '../interfaces/user-repository.interface';
import { ITotpBackupCodeRepository } from '../interfaces/totp-backup-code-repository.interface';
import { IPasswordService } from '../interfaces/password-service.interface';
import { ITotpService } from '../interfaces/totp-service.interface';
import { IAuditLogService } from '../interfaces/audit-log-service.interface';
import { Email } from '../../domain/value-objects/email';
import { getTotpEncryptionKey } from '../../infrastructure/config/env-validator';

export interface ResetupTotpDTO {
  password: string;
}

export interface ResetupTotpResult {
  qrCodeUrl: string;
  secret: string;
  backupCodes: string[];
}

export class ResetupTotpUseCase {
  constructor(
    private userRepository: IUserRepository,
    private totpBackupCodeRepository: ITotpBackupCodeRepository,
    private passwordService: IPasswordService,
    private totpService: ITotpService,
    private auditLogService: IAuditLogService
  ) {}

  async execute(
    userId: string,
    dto: ResetupTotpDTO,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<ResetupTotpResult> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isUserActive()) {
      throw new Error('Account is inactive');
    }

    const isPasswordValid = await this.passwordService.verifyPassword(
      dto.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      await this.auditLogService.logEvent({
        userId: user.id,
        eventType: 'TOTP_RESETUP_ATTEMPT',
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        success: false,
        errorMessage: 'Invalid password',
      });
      throw new Error('Invalid password');
    }

    const email = new Email(user.email);
    const totpSetup = await this.totpService.generateTotpSetup(email.getValue());

    const encryptionKey = getTotpEncryptionKey();
    const encryptedSecret = this.totpService.encryptSecret(totpSetup.secret, encryptionKey);

    const hashedBackupCodes = await Promise.all(
      totpSetup.backupCodes.map(async (code) => {
        return await this.passwordService.hashPassword(code);
      })
    );

    await this.userRepository.update(user.id, {
      totpSecret: encryptedSecret,
      totpVerified: false,
    });

    await this.totpBackupCodeRepository.deleteAllForUser(user.id);
    await this.totpBackupCodeRepository.createCodes(user.id, hashedBackupCodes);

    await this.auditLogService.logEvent({
      userId: user.id,
      eventType: 'TOTP_RESETUP',
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      success: true,
    });

    return {
      qrCodeUrl: totpSetup.qrCodeUrl,
      secret: totpSetup.secret,
      backupCodes: totpSetup.backupCodes,
    };
  }
}
