/**
 * Console Email Service Implementation
 * 
 * Development implementation that logs emails to console.
 * Used when EMAIL_PROVIDER=console or in development mode.
 */

import { IEmailService } from '../../application/interfaces/email-service.interface';

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
    console.log('\n📧 ========================================');
    console.log('📧 PASSWORD RESET EMAIL (Development)');
    console.log('📧 ========================================');
    console.log(`📧 To: ${to}`);
    console.log(`📧 Subject: Reset Your Password - void`);
    console.log(`📧 Reset Token: ${resetToken}`);
    console.log(`📧 Reset Link: ${resetLink}`);
    console.log('📧 ========================================\n');
    
    // In development, you can click the link directly
    console.log('💡 TIP: Copy the reset link above and open it in your browser');
  }

  async sendWelcomeEmail(to: string, firstName?: string, tempPassword?: string): Promise<void> {
    console.log('\n📧 ========================================');
    console.log('📧 WELCOME EMAIL (Development)');
    console.log('📧 ========================================');
    console.log(`📧 To: ${to}`);
    console.log(`📧 Subject: Welcome to void`);
    if (firstName) {
      console.log(`📧 Greeting: Hello ${firstName},`);
    }
    if (tempPassword) {
      console.log(`📧 Temporary Password: ${tempPassword}`);
    }
    console.log('📧 ========================================\n');
  }

  async sendPasswordChangeNotification(
    to: string,
    firstName?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    console.log('\n📧 ========================================');
    console.log('📧 PASSWORD CHANGE NOTIFICATION (Development)');
    console.log('📧 ========================================');
    console.log(`📧 To: ${to}`);
    console.log(`📧 Subject: Password Changed - void`);
    if (firstName) {
      console.log(`📧 Greeting: Hello ${firstName},`);
    }
    if (ipAddress) {
      console.log(`📧 IP Address: ${ipAddress}`);
    }
    if (userAgent) {
      console.log(`📧 User Agent: ${userAgent}`);
    }
    console.log('📧 ========================================\n');
  }

  async sendNewDeviceLoginAlert(
    to: string,
    firstName: string | undefined,
    deviceType: string,
    deviceName: string,
    ipAddress?: string,
    location?: string
  ): Promise<void> {
    console.log('\n📧 ========================================');
    console.log('📧 NEW DEVICE LOGIN ALERT (Development)');
    console.log('📧 ========================================');
    console.log(`📧 To: ${to}`);
    console.log(`📧 Subject: New Device Login Alert - void`);
    if (firstName) {
      console.log(`📧 Greeting: Hello ${firstName},`);
    }
    console.log(`📧 Device Type: ${deviceType}`);
    console.log(`📧 Device Name: ${deviceName}`);
    if (ipAddress) {
      console.log(`📧 IP Address: ${ipAddress}`);
    }
    if (location) {
      console.log(`📧 Location: ${location}`);
    }
    console.log('📧 ========================================\n');
  }
}
