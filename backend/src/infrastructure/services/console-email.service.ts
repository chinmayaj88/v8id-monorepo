/**
 * Console Email Service Implementation
 * 
 * Development implementation that logs emails to console.
 * Used when EMAIL_PROVIDER=console or in development mode.
 */

import { IEmailService } from '../../application/interfaces/email-service.interface';

export class ConsoleEmailService implements IEmailService {
  private frontendUrl: string;

  constructor() {
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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
    console.log(`📧 Subject: Reset Your Password - v8id-cloud`);
    console.log(`📧 Reset Token: ${resetToken}`);
    console.log(`📧 Reset Link: ${resetLink}`);
    console.log('📧 ========================================\n');
    
    // In development, you can click the link directly
    console.log('💡 TIP: Copy the reset link above and open it in your browser');
  }

  async sendWelcomeEmail(to: string, firstName?: string): Promise<void> {
    console.log('\n📧 ========================================');
    console.log('📧 WELCOME EMAIL (Development)');
    console.log('📧 ========================================');
    console.log(`📧 To: ${to}`);
    console.log(`📧 Subject: Welcome to v8id-cloud`);
    if (firstName) {
      console.log(`📧 Greeting: Hello ${firstName},`);
    }
    console.log('📧 ========================================\n');
  }
}
