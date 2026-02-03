/**
 * Create User Use Case
 *
 * Creates a new user account (admin-only operation).
 * TOTP is mandatory and automatically generated for all users.
 */

import { IUserRepository } from '../interfaces/user-repository.interface.js';
import { ITotpBackupCodeRepository } from '../interfaces/totp-backup-code-repository.interface.js';
import { IEmailService } from '../interfaces/email-service.interface.js';
import { IPasswordService } from '../interfaces/password-service.interface.js';
import { ITotpService } from '../interfaces/totp-service.interface.js';
import { CreateUserDTO } from '../dtos/auth.dto.js';
import { Email } from '../../domain/value-objects/email.js';
import { Password } from '../../domain/value-objects/password.js';
import { ConfigServiceFactory } from '../../infrastructure/config/config-service.factory.js';

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

  async execute(dto: CreateUserDTO, adminUserId: string): Promise<CreateUserResult> {
    const admin = await this.userRepository.findById(adminUserId);
    if (!admin || !admin.canCreateUsers()) {
      throw new Error('Only admins can create users');
    }

    const email = new Email(dto.email);

    const emailExists = await this.userRepository.emailExists(email.getValue());
    if (emailExists) {
      throw new Error('Email already exists');
    }

    const password = new Password(dto.password);

    const passwordHash = await this.passwordService.hashPassword(password.getValue());

    const totpSetup = await this.totpService.generateTotpSetup(email.getValue());

    const config = ConfigServiceFactory.getInstance();
    const encryptionKey = config.getRequired('TOTP_ENCRYPTION_KEY');
    const encryptedSecret = this.totpService.encryptSecret(totpSetup.secret, encryptionKey);

    const hashedBackupCodes = await Promise.all(
      totpSetup.backupCodes.map(async code => {
        return await this.passwordService.hashPassword(code);
      })
    );

    const user = await this.userRepository.create({
      email: email.getValue(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role ?? 'USER',
      storageQuota: dto.storageQuota ? BigInt(dto.storageQuota) : undefined,
      totpSecret: encryptedSecret,
      totpVerified: false,
    });

    await this.totpBackupCodeRepository.createCodes(user.id, hashedBackupCodes);

    try {
      await this.emailService.sendWelcomeEmail(user.email, user.firstName, dto.password);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
      totpSetup: {
        qrCodeUrl: totpSetup.qrCodeUrl,
        secret: totpSetup.secret,
        backupCodes: totpSetup.backupCodes,
      },
    };
  }
}
