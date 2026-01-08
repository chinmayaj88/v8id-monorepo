/**
 * Resend Email Service Implementation
 * 
 * Production implementation using Resend API.
 * Requires RESEND_API_KEY environment variable.
 */

import { Resend } from 'resend';
import { IEmailService } from '../../application/interfaces/email-service.interface';

export class ResendEmailService implements IEmailService {
  private resend: Resend;
  private fromEmail: string;
  private frontendUrl: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    this.resend = new Resend(apiKey);
    
    // For testing without domain verification, use Resend's test domain
    // Or use a verified email address from your Resend account
    // In production, use your verified domain (e.g., noreply@yourdomain.com)
    this.fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    
    // Warn if using default test domain
    if (!process.env.EMAIL_FROM) {
      console.log('📧 Using Resend test domain: onboarding@resend.dev');
      console.log('💡 For production, set EMAIL_FROM to your verified domain');
    }
  }

  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    resetLink: string
  ): Promise<void> {
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Reset Your Password - v8id-cloud',
        html: this.getPasswordResetEmailTemplate(resetLink),
      });

      if (result.error) {
        console.error('Resend API Error:', result.error);
        throw new Error(`Failed to send email: ${result.error.message || 'Unknown error'}`);
      }

      console.log(`✅ Password reset email sent successfully to ${to}`);
      console.log(`   Email ID: ${result.data?.id || 'N/A'}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Failed to send password reset email:', errorMessage);
      
      // Provide helpful error messages
      if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        if (errorMessage.includes('domain') || errorMessage.includes('not verified')) {
          console.error('\n❌ Domain Verification Error:');
          console.error('   Your email domain is not verified in Resend.');
          console.error('\n💡 Solutions:');
          console.error('   1. Verify your domain at: https://resend.com/domains');
          console.error('   2. OR use Resend test domain (onboarding@resend.dev) - works for testing');
          console.error('   3. OR set EMAIL_FROM to a verified email address');
          console.error(`   Current EMAIL_FROM: ${this.fromEmail}\n`);
          throw new Error('Email domain not verified. Use onboarding@resend.dev for testing or verify your domain.');
        }
        throw new Error('Invalid Resend API key. Please check RESEND_API_KEY environment variable.');
      }
      
      throw new Error(`Failed to send password reset email: ${errorMessage}`);
    }
  }

  async sendWelcomeEmail(to: string, firstName?: string): Promise<void> {
    try {
      await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Welcome to v8id-cloud',
        html: this.getWelcomeEmailTemplate(firstName),
      });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  private getPasswordResetEmailTemplate(resetLink: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Reset Your Password</h1>
    
    <p>You requested to reset your password for your v8id-cloud account.</p>
    
    <p>Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetLink}" 
         style="display: inline-block; background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Reset Password
      </a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      Or copy and paste this link into your browser:<br>
      <a href="${resetLink}" style="color: #007bff; word-break: break-all;">${resetLink}</a>
    </p>
    
    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      <strong>Security Notice:</strong><br>
      If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
    </p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      This is an automated message from v8id-cloud. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  private getWelcomeEmailTemplate(firstName?: string): string {
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to v8id-cloud</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Welcome to v8id-cloud!</h1>
    
    <p>${greeting}</p>
    
    <p>Your account has been created successfully. You can now access your secure cloud storage.</p>
    
    <p>Thank you for choosing v8id-cloud for your secure document storage needs.</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      This is an automated message from v8id-cloud. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `.trim();
  }
}
