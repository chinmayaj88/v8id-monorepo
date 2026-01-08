/**
 * Email Service Interface
 * 
 * Defines the contract for email sending operations.
 * Implementations can be swapped (Resend, SendGrid, AWS SES, etc.)
 */

export interface IEmailService {
  /**
   * Send password reset email
   */
  sendPasswordResetEmail(
    to: string,
    resetToken: string,
    resetLink: string
  ): Promise<void>;

  /**
   * Send welcome email (for future use)
   */
  sendWelcomeEmail(
    to: string,
    firstName?: string
  ): Promise<void>;
}
