/**
 * Create User Use Case
 * 
 * Creates a new user account (admin-only operation).
 * TOTP is mandatory and automatically generated for all users.
 */

import { IUserRepository } from '../interfaces/user-repository.interface';
import { ITotpBackupCodeRepository } from '../interfaces/totp-backup-code-repository.interface';
import { IEmailService } from '../interfaces/email-service.interface';
import { IPasswordService } from '../interfaces/password-service.interface';
import { ITotpService } from '../interfaces/totp-service.interface';
import { CreateUserDTO } from '../dtos/auth.dto';
import { Email } from '../../domain/value-objects/email';
import { Password } from '../../domain/value-objects/password';

export interface CreateUserResult {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  emailVerified: boolean;
  totpSetup: {
    qrCodeUrl: string;
    secret: string;
    backupCodes: string[];
  };
}

export class CreateUserUseCase {
  constructor(
    private userRepository: IUserRepository,
    private totpBackupCodeRepository: ITotpBackupCodeRepository,
    private emailService: IEmailService,
    private passwordService: IPasswordService,
    private totpService: ITotpService
  ) {}

  async execute(
    dto: CreateUserDTO,
    adminUserId: string
  ): Promise<CreateUserResult> {
    // 1. Verify admin user exists and is admin
    const admin = await this.userRepository.findById(adminUserId);
    if (!admin || !admin.canCreateUsers()) {
      throw new Error('Only admins can create users');
    }

    // 2. Validate email
    const email = new Email(dto.email);

    // 3. Check if email already exists
    const emailExists = await this.userRepository.emailExists(email.getValue());
    if (emailExists) {
      throw new Error('Email already exists');
    }

    // 4. Validate password
    const password = new Password(dto.password);

    // 5. Hash password
    const passwordHash = await this.passwordService.hashPassword(password.getValue());

    // 6. Generate TOTP setup (MANDATORY for all users)
    const totpSetup = await this.totpService.generateTotpSetup(email.getValue());

    // 7. Encrypt TOTP secret
    const encryptionKey = process.env.TOTP_ENCRYPTION_KEY || 'default-key-change-in-production';
    const encryptedSecret = this.totpService.encryptSecret(totpSetup.secret, encryptionKey);

    // 8. Hash backup codes for storage
    const hashedBackupCodes = await Promise.all(
      totpSetup.backupCodes.map(async (code) => {
        return await this.passwordService.hashPassword(code);
      })
    );

      // 9. Create user with TOTP (mandatory - totpSecret existence means TOTP is enabled)
      const user = await this.userRepository.create({
        email: email.getValue(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role ?? 'USER',
        storageQuota: dto.storageQuota ? BigInt(dto.storageQuota) : undefined,
        totpSecret: encryptedSecret, // TOTP is mandatory - secret must exist
        totpVerified: false, // User needs to verify TOTP setup
      });

    // 10. Store backup codes in database
    await this.totpBackupCodeRepository.createCodes(user.id, hashedBackupCodes);

    // 11. Send welcome email (non-blocking - don't fail user creation if email fails)
    try {
      await this.emailService.sendWelcomeEmail(
        user.email,
        user.firstName,
        dto.password // Include temporary password if provided
      );
    } catch (error) {
      // Log error but don't fail user creation
      console.error('Failed to send welcome email:', error);
      // In development, still log the email info
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Welcome Email] Would send to ${user.email}`);
      }
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      totpSetup: {
        qrCodeUrl: totpSetup.qrCodeUrl, // Frontend will display this QR code
        secret: totpSetup.secret, // For manual entry if QR code doesn't work
        backupCodes: totpSetup.backupCodes, // User must save these securely
      },
    };
  }
}

