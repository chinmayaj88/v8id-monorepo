/**
 * Forgot Password Use Case
 * 
 * Generates a password reset token and stores it with expiration.
 * Sends password reset email via IEmailService (Resend in production, console in development).
 */

import { IUserRepository } from '../interfaces/user-repository.interface';
import { IEmailService } from '../interfaces/email-service.interface';
import { AuditLogService } from '../../infrastructure/services/audit-log.service';
import crypto from 'crypto';

export class ForgotPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private auditLogService: AuditLogService,
    private emailService: IEmailService
  ) {}

  async execute(
    email: string,
    options?: {
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(email);

    // Always return success (don't reveal if email exists)
    // This prevents email enumeration attacks
    if (!user) {
      // Log the attempt even if user doesn't exist (for security monitoring)
      await this.auditLogService.logPasswordResetRequest(undefined, false, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        email,
        errorMessage: 'User not found',
      });
      return; // Return silently to prevent email enumeration
    }

    // 2. Check if user is active
    if (!user.isUserActive()) {
      await this.auditLogService.logPasswordResetRequest(user.id, false, {
        ipAddress: options?.ipAddress,
        userAgent: options?.userAgent,
        email,
        errorMessage: 'Account is inactive',
      });
      return; // Return silently
    }

    // 3. Generate secure reset token (cryptographically random)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // 4. Set expiration (1 hour from now)
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1);

    // 5. Store reset token and expiration
    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });

    // 6. Log password reset request
    await this.auditLogService.logPasswordResetRequest(user.id, true, {
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      email,
    });

    // 7. Send password reset email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken, resetLink);
    } catch (error) {
      // Log error but don't fail the request (email sending is not critical for security)
      // The token is still generated and stored, user can request again if needed
      console.error('Failed to send password reset email:', error);
      // In development, still log the token for testing
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Password Reset] Token for ${email}: ${resetToken}`);
        console.log(`[Password Reset] Reset link: ${resetLink}`);
      }
    }
  }
}
