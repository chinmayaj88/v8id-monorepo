/**
 * Forgot Password Use Case
 * 
 * Generates a password reset token and stores it with expiration.
 * In production, this would send an email with the reset link.
 */

import { IUserRepository } from '../interfaces/user-repository.interface';
import { AuditLogService } from '../../infrastructure/services/audit-log.service';
import { JwtService } from '../../infrastructure/services/jwt.service';
import crypto from 'crypto';

export class ForgotPasswordUseCase {
  constructor(
    private userRepository: IUserRepository,
    private auditLogService: AuditLogService
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

    // 7. In production, send email with reset link
    // For now, we'll just log it (you can integrate with email service later)
    console.log(`[Password Reset] Token for ${email}: ${resetToken}`);
    console.log(`[Password Reset] Reset link: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);
    
    // TODO: Integrate with email service
    // await emailService.sendPasswordResetEmail(user.email, resetToken);
  }
}
