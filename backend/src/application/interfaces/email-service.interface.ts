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
   * Send welcome email when user account is created
   */
  sendWelcomeEmail(
    to: string,
    firstName?: string,
    tempPassword?: string
  ): Promise<void>;

  /**
   * Send password change notification
   */
  sendPasswordChangeNotification(
    to: string,
    firstName?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void>;

  /**
   * Send new device login alert
   */
  sendNewDeviceLoginAlert(
    to: string,
    firstName: string | undefined,
    deviceType: string,
    deviceName: string,
    ipAddress?: string,
    location?: string
  ): Promise<void>;
}
