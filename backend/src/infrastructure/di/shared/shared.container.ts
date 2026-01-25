/**
 * Shared Dependency Injection Container
 *
 * Provides common repositories and infrastructure services.
 */

import {
  UserRepository,
  DeviceSessionRepository,
  AuditLogRepository,
  TotpBackupCodeRepository,
} from '../../repositories/index.js';
import {
  PasswordService,
  JwtService,
  TotpService,
  AuditLogService,
  AccountLockoutService,
  SuspiciousActivityService,
  EmailServiceFactory,
} from '../../services/index.js';
import { TierAwareStorageService } from '../../oci/tier-aware-storage.service.js';

export class SharedContainer {
  private static instance: SharedContainer;

  // Repositories
  public readonly userRepository: UserRepository;
  public readonly deviceSessionRepository: DeviceSessionRepository;
  public readonly auditLogRepository: AuditLogRepository;
  public readonly totpBackupCodeRepository: TotpBackupCodeRepository;

  // Services
  public readonly passwordService: PasswordService;
  public readonly jwtService: JwtService;
  public readonly totpService: TotpService;
  public readonly auditLogService: AuditLogService;
  public readonly accountLockoutService: AccountLockoutService;
  public readonly suspiciousActivityService: SuspiciousActivityService;
  public readonly emailService: any;
  public readonly storageService: TierAwareStorageService;

  private constructor() {
    this.passwordService = new PasswordService(parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
    this.jwtService = new JwtService();
    this.totpService = new TotpService();
    this.emailService = EmailServiceFactory.create();
    this.storageService = new TierAwareStorageService();

    this.userRepository = new UserRepository();
    this.deviceSessionRepository = new DeviceSessionRepository();
    this.auditLogRepository = new AuditLogRepository();
    this.totpBackupCodeRepository = new TotpBackupCodeRepository(this.passwordService);

    this.auditLogService = new AuditLogService(this.auditLogRepository);
    this.accountLockoutService = new AccountLockoutService(this.auditLogRepository);
    this.suspiciousActivityService = new SuspiciousActivityService(this.auditLogRepository);
  }

  public static getInstance(): SharedContainer {
    if (!SharedContainer.instance) {
      SharedContainer.instance = new SharedContainer();
    }
    return SharedContainer.instance;
  }
}

export const sharedContainer = SharedContainer.getInstance();

