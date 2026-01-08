/**
 * Resetup TOTP Use Case
 * 
 * Allows authenticated users to re-setup TOTP if they lose access to their authenticator.
 * Requires password verification for security.
 * This will invalidate the old TOTP secret and generate a new one.
 */

import { IUserRepository } from '../interfaces/user-repository.interface';
import { ITotpBackupCodeRepository } from '../interfaces/totp-backup-code-repository.interface';
import { PasswordService } from '../../infrastructure/services/password.service';
import { TotpService } from '../../infrastructure/services/totp.service';
import { AuditLogService } from '../../infrastructure/services/audit-log.service';
import { Email } from '../../domain/value-objects/email';

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
    private auditLogService: AuditLogService
  ) {}

  async execute(
    userId: string,
    dto: ResetupTotpDTO,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<ResetupTotpResult> {
    // 1. Get user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 2. Check if user is active
    if (!user.isUserActive()) {
      throw new Error('Account is inactive');
    }

    // 3. Verify password
    const isPasswordValid = await PasswordService.verifyPassword(
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

    // 4. Generate new TOTP setup
    const email = new Email(user.email);
    const totpSetup = await TotpService.generateTotpSetup(email.getValue());

    // 5. Encrypt TOTP secret
    const encryptionKey = process.env.TOTP_ENCRYPTION_KEY || 'default-key-change-in-production';
    const encryptedSecret = TotpService.encryptSecret(totpSetup.secret, encryptionKey);

    // 6. Hash backup codes for storage
    const hashedBackupCodes = await Promise.all(
      totpSetup.backupCodes.map(async (code) => {
        return await PasswordService.hashPassword(code);
      })
    );

    // 7. Update user with new TOTP secret and reset verified flag
    await this.userRepository.update(user.id, {
      totpSecret: encryptedSecret,
      totpVerified: false, // User needs to verify new TOTP setup
    });

    // 8. Delete old backup codes and create new ones
    await this.totpBackupCodeRepository.deleteAllForUser(user.id);
    await this.totpBackupCodeRepository.createCodes(user.id, hashedBackupCodes);

    // 9. Log successful resetup
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
