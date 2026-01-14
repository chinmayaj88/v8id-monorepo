/**
 * Forgot Password Use Case
 * 
 * Generates a password reset token and stores it with expiration.
 * Sends password reset email via IEmailService (Nodemailer in production, console in development).
 */

import { IUserRepository } from '../interfaces/user-repository.interface';
import { IEmailService } from '../interfaces/email-service.interface';
import { IAuditLogService } from '../interfaces/audit-log-service.interface';
import crypto from 'crypto';

export class ForgotPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private auditLogService: IAuditLogService,
    private emailService: IEmailService
  ) {}

  async execute(
    email: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      await this.auditLogService.logPasswordResetRequest(undefined, false, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        email,
        errorMessage: 'User not found',
      });
      return;
    }

    if (!user.isUserActive()) {
      await this.auditLogService.logPasswordResetRequest(user.id, false, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        email,
        errorMessage: 'Account is inactive',
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    await this.auditLogService.logPasswordResetRequest(user.id, true, {
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      email,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken, resetLink);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  }
}
