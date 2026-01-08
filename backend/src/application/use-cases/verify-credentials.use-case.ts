/**
 * Verify Credentials Use Case
 * 
 * First step of two-step login: Verifies email and password.
 * Returns a temporary session token that can be used to verify TOTP.
 */

import { IUserRepository } from '../interfaces/user-repository.interface';
import { PasswordService } from '../../infrastructure/services/password.service';
import { JwtService } from '../../infrastructure/services/jwt.service';
import { AuditLogService } from '../../infrastructure/services/audit-log.service';
import { AccountLockoutService } from '../../infrastructure/services/account-lockout.service';

export interface VerifyCredentialsResult {
  requiresTotp: boolean;
  tempToken: string; // Temporary token for TOTP verification step
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

export interface VerifyCredentialsOptions {
  ipAddress?: string;
  userAgent?: string;
  email?: string; // Email address of the user attempting to login
}

export class VerifyCredentialsUseCase {
  constructor(
    private userRepository: IUserRepository,
    private auditLogService: AuditLogService,
    private accountLockoutService: AccountLockoutService
  ) {}

  async execute(
    email: string,
    password: string,
    options?: VerifyCredentialsOptions
  ): Promise<VerifyCredentialsResult> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Log failed login attempt for unknown user (userId is undefined since user doesn't exist)
      await this.auditLogService.logLogin(undefined, false, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        email: options?.email || email, // Store email in audit log
        errorMessage: 'User not found',
      });
      throw new Error('Invalid credentials');
    }

    // 2. Check if user is active
    if (!user.isUserActive()) {
      // Log failed login attempt for inactive account
      await this.auditLogService.logLogin(user.id, false, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        email: options?.email || email, // Store email in audit log
        errorMessage: 'Account is inactive',
      });
      throw new Error('Account is inactive');
    }

    // 2.5. Check if account is locked due to too many failed attempts
    const lockoutStatus = await this.accountLockoutService.isAccountLocked(user.id);
    if (lockoutStatus.locked) {
      const unlockAt = lockoutStatus.unlockAt;
      const minutesRemaining = unlockAt
        ? Math.ceil((unlockAt.getTime() - Date.now()) / (60 * 1000))
        : 15;
      
      await this.auditLogService.logLogin(user.id, false, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        email: options?.email || email,
        errorMessage: `Account locked due to too many failed login attempts. Try again in ${minutesRemaining} minute(s).`,
      });
      
      throw new Error(
        `Account is temporarily locked due to too many failed login attempts. Please try again in ${minutesRemaining} minute(s).`
      );
    }

    // 3. Verify password
    const isPasswordValid = await PasswordService.verifyPassword(
      password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      // Log failed login attempt for invalid password
      await this.auditLogService.logLogin(user.id, false, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        email: options?.email || email, // Store email in audit log
        errorMessage: 'Invalid password',
      });
      throw new Error('Invalid credentials');
    }

    // 4. Check if TOTP is required (TOTP is mandatory - check if secret exists)
    const requiresTotp = !!user.totpSecret;

    // 5. Generate temporary token (short-lived, 5 minutes) for TOTP verification
    // Include tokenVersion to ensure token is valid
    const tempToken = JwtService.generateTempToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    return {
      requiresTotp,
      tempToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}

