/**
 * Console Email Service Implementation
 * 
 * Development implementation that logs emails to console.
 * Used when EMAIL_PROVIDER=console or in development mode.
 */

import { IEmailService } from '../../application/interfaces/email-service.interface.js';

export class ConsoleEmailService implements IEmailService {
  constructor() {
    // frontendUrl is not currently used in console output
    // Keeping constructor for potential future use
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    resetLink: string
  ): Promise<void> {
    console.log(`[Email] Password reset for ${to}: ${resetLink}`);
  }

  async sendWelcomeEmail(to: string, firstName?: string, tempPassword?: string): Promise<void> {
    console.log(`[Email] Welcome email sent to ${to}${tempPassword ? ` (temp password: ${tempPassword})` : ''}`);
  }

  async sendPasswordChangeNotification(
    to: string,
    firstName?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    console.log(`[Email] Password change notification sent to ${to}`);
  }

  async sendNewDeviceLoginAlert(
    to: string,
    firstName: string | undefined,
    deviceType: string,
    deviceName: string,
    ipAddress?: string,
    location?: string
  ): Promise<void> {
    console.log(`[Email] New device login alert sent to ${to} (${deviceType}: ${deviceName})`);
  }

  async sendSuspiciousActivityAlert(
    to: string,
    firstName: string | undefined,
    activityType: string,
    details: Record<string, any>,
    timestamp: Date,
    ipAddress?: string
  ): Promise<void> {
    console.log(`[Email] Suspicious activity alert sent to ${to} (${activityType})`);
  }
}
