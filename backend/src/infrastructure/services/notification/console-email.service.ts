/**
 * Console Email Service Implementation
 *
 * Development implementation that logs emails to console.
 * Used when EMAIL_PROVIDER=console or in development mode.
 */

import { IEmailService } from '../../../application/interfaces/index.js';

export class ConsoleEmailService implements IEmailService {
  constructor() {
    // frontendUrl is not currently used in console output
    // Keeping constructor for potential future use
  }

  async sendPasswordResetEmail(to: string, _resetToken: string, resetLink: string): Promise<void> {
    console.log(`[Email] Password reset for ${to}: ${resetLink}`);
  }

  async sendWelcomeEmail(to: string, _firstName?: string, tempPassword?: string): Promise<void> {
    console.log(
      `[Email] Welcome email sent to ${to}${tempPassword ? ` (temp password: ${tempPassword})` : ''}`
    );
  }

  async sendPasswordChangeNotification(
    to: string,
    _firstName?: string,
    _ipAddress?: string,
    _userAgent?: string
  ): Promise<void> {
    console.log(`[Email] Password change notification sent to ${to}`);
  }

  async sendNewDeviceLoginAlert(
    to: string,
    _firstName: string | undefined,
    deviceType: string,
    deviceName: string,
    _ipAddress?: string,
    _location?: string
  ): Promise<void> {
    console.log(`[Email] New device login alert sent to ${to} (${deviceType}: ${deviceName})`);
  }

  async sendSuspiciousActivityAlert(
    to: string,
    _firstName: string | undefined,
    activityType: string,
    _details: Record<string, any>,
    _timestamp: Date,
    _ipAddress?: string
  ): Promise<void> {
    console.log(`[Email] Suspicious activity alert sent to ${to} (${activityType})`);
  }
}


