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
    // frontendUrl is not currently used in email templates
    // Keeping for potential future use
    
    // Warn if using default test domain
    if (!process.env.EMAIL_FROM) {
      console.log('📧 Using Resend test domain: onboarding@resend.dev');
      console.log('💡 For production, set EMAIL_FROM to your verified domain');
    }
  }

  async sendPasswordResetEmail(
    to: string,
    _resetToken: string,
    resetLink: string
  ): Promise<void> {
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Reset Your Password - void',
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

  async sendWelcomeEmail(
    to: string,
    firstName?: string,
    tempPassword?: string
  ): Promise<void> {
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Welcome to void',
        html: this.getWelcomeEmailTemplate(firstName, tempPassword),
      });

      if (result.error) {
        console.error('Resend API Error:', result.error);
        throw new Error(`Failed to send email: ${result.error.message || 'Unknown error'}`);
      }

      console.log(`✅ Welcome email sent successfully to ${to}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  async sendPasswordChangeNotification(
    to: string,
    firstName?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Password Changed - void',
        html: this.getPasswordChangeNotificationTemplate(firstName, ipAddress, userAgent),
      });

      if (result.error) {
        console.error('Resend API Error:', result.error);
        throw new Error(`Failed to send email: ${result.error.message || 'Unknown error'}`);
      }

      console.log(`✅ Password change notification sent to ${to}`);
    } catch (error) {
      console.error('Failed to send password change notification:', error);
      throw new Error('Failed to send password change notification');
    }
  }

  async sendNewDeviceLoginAlert(
    to: string,
    firstName: string | undefined,
    deviceType: string,
    deviceName: string,
    ipAddress?: string,
    location?: string
  ): Promise<void> {
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'New Device Login Alert - void',
        html: this.getNewDeviceLoginAlertTemplate(
          firstName,
          deviceType,
          deviceName,
          ipAddress,
          location
        ),
      });

      if (result.error) {
        console.error('Resend API Error:', result.error);
        throw new Error(`Failed to send email: ${result.error.message || 'Unknown error'}`);
      }

      console.log(`✅ New device login alert sent to ${to}`);
    } catch (error) {
      console.error('Failed to send new device login alert:', error);
      throw new Error('Failed to send new device login alert');
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
    
    <p>You requested to reset your password for your void account.</p>
    
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
      This is an automated message from void. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  private getWelcomeEmailTemplate(firstName?: string, tempPassword?: string): string {
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to void</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Welcome to void!</h1>
    
    <p>${greeting}</p>
    
    <p>Your account has been created successfully. You can now access your secure cloud storage.</p>
    
    ${tempPassword ? `
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">⚠️ Temporary Password:</p>
      <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 14px;">${tempPassword}</p>
      <p style="margin: 10px 0 0 0; font-size: 12px;">Please change this password after your first login.</p>
    </div>
    ` : ''}
    
    <p><strong>Next Steps:</strong></p>
    <ol>
      <li>Scan the QR code provided during account creation with an authenticator app</li>
      <li>Complete TOTP setup by verifying your first login</li>
      <li>Save your backup codes in a secure location</li>
      <li>${tempPassword ? 'Change your temporary password' : 'Start using your secure cloud storage'}</li>
    </ol>
    
    <p>Thank you for choosing void for your secure document storage needs.</p>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      This is an automated message from void. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  private getPasswordChangeNotificationTemplate(
    firstName?: string,
    ipAddress?: string,
    userAgent?: string
  ): string {
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    const timestamp = new Date().toLocaleString();
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">Password Changed Successfully</h1>
    
    <p>${greeting}</p>
    
    <p>Your password has been changed successfully.</p>
    
    <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">🔒 Security Notice:</p>
      <ul style="margin: 10px 0 0 20px; padding: 0;">
        <li>All existing sessions have been invalidated</li>
        <li>You must login again on all devices</li>
        <li>If you didn't make this change, please contact support immediately</li>
      </ul>
    </div>
    
    <p><strong>Change Details:</strong></p>
    <ul style="color: #666; font-size: 14px;">
      <li>Time: ${timestamp}</li>
      ${ipAddress ? `<li>IP Address: ${ipAddress}</li>` : ''}
      ${userAgent ? `<li>Device: ${userAgent}</li>` : ''}
    </ul>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      This is an automated security notification from void. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  private getNewDeviceLoginAlertTemplate(
    firstName: string | undefined,
    deviceType: string,
    deviceName: string,
    ipAddress?: string,
    location?: string
  ): string {
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    const timestamp = new Date().toLocaleString();
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Device Login</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #2c3e50; margin-top: 0;">🔔 New Device Login Alert</h1>
    
    <p>${greeting}</p>
    
    <p>A new device has logged into your void account.</p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">Device Information:</p>
      <ul style="margin: 10px 0 0 20px; padding: 0;">
        <li><strong>Type:</strong> ${deviceType}</li>
        <li><strong>Name:</strong> ${deviceName}</li>
        ${ipAddress ? `<li><strong>IP Address:</strong> ${ipAddress}</li>` : ''}
        ${location ? `<li><strong>Location:</strong> ${location}</li>` : ''}
        <li><strong>Time:</strong> ${timestamp}</li>
      </ul>
    </div>
    
    <p><strong>If this was you:</strong> No action needed. You can safely ignore this email.</p>
    
    <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">⚠️ If this wasn't you:</p>
      <ul style="margin: 10px 0 0 20px; padding: 0;">
        <li>Change your password immediately</li>
        <li>Revoke all sessions from your account settings</li>
        <li>Contact support if you suspect unauthorized access</li>
      </ul>
    </div>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      This is an automated security notification from void. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  async sendSuspiciousActivityAlert(
    to: string,
    firstName: string | undefined,
    activityType: string,
    details: Record<string, any>,
    timestamp: Date,
    ipAddress?: string
  ): Promise<void> {
    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: `⚠️ Suspicious Activity Detected - void`,
        html: this.getSuspiciousActivityAlertTemplate(
          firstName,
          activityType,
          details,
          timestamp,
          ipAddress
        ),
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to send suspicious activity alert email:', errorMessage);
      throw new Error(`Failed to send suspicious activity alert email: ${errorMessage}`);
    }
  }

  private getSuspiciousActivityAlertTemplate(
    firstName: string | undefined,
    activityType: string,
    details: Record<string, any>,
    timestamp: Date,
    ipAddress?: string
  ): string {
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    const formattedTime = timestamp.toLocaleString();
    
    let activityDescription = '';
    let recommendedActions = '';
    
    switch (activityType) {
      case 'MULTIPLE_FAILED_LOGINS':
        activityDescription = `
          <p><strong>Multiple Failed Login Attempts Detected</strong></p>
          <p>We detected ${details.count || 'multiple'} failed login attempts on your account within the last ${details.timeWindow || '15 minutes'}.</p>
          ${ipAddress ? `<p><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
        `;
        recommendedActions = `
          <ul style="margin: 10px 0 0 20px; padding: 0;">
            <li>If this was you: Make sure you're using the correct password and TOTP code</li>
            <li>If this wasn't you: Change your password immediately</li>
            <li>Review your active sessions and revoke any suspicious ones</li>
            <li>Enable additional security measures if available</li>
          </ul>
        `;
        break;
      case 'MULTIPLE_FAILED_TOTP':
        activityDescription = `
          <p><strong>Multiple Failed TOTP Verification Attempts</strong></p>
          <p>We detected ${details.count || 'multiple'} failed TOTP code verification attempts on your account within the last ${details.timeWindow || '15 minutes'}.</p>
          ${ipAddress ? `<p><strong>IP Address:</strong> ${ipAddress}</p>` : ''}
        `;
        recommendedActions = `
          <ul style="margin: 10px 0 0 20px; padding: 0;">
            <li>If this was you: Make sure you're entering the correct TOTP code from your authenticator app</li>
            <li>Check if your device time is synchronized correctly</li>
            <li>If this wasn't you: Change your password and regenerate TOTP backup codes</li>
            <li>Review your active sessions immediately</li>
          </ul>
        `;
        break;
      case 'UNUSUAL_LOCATION':
        activityDescription = `
          <p><strong>Login from Unusual Location</strong></p>
          <p>We detected a login to your account from an IP address that differs from your recent login locations.</p>
          ${ipAddress ? `<p><strong>Current IP Address:</strong> ${ipAddress}</p>` : ''}
          ${details.currentLocation ? `<p><strong>Location:</strong> ${details.currentLocation}</p>` : ''}
        `;
        recommendedActions = `
          <ul style="margin: 10px 0 0 20px; padding: 0;">
            <li>If this was you: No action needed. We're just keeping you informed.</li>
            <li>If this wasn't you: Change your password immediately</li>
            <li>Revoke all sessions and re-login from trusted devices</li>
            <li>Contact support if you suspect unauthorized access</li>
          </ul>
        `;
        break;
      default:
        activityDescription = `
          <p><strong>Suspicious Activity Detected</strong></p>
          <p>We detected unusual activity on your account that may require your attention.</p>
        `;
        recommendedActions = `
          <ul style="margin: 10px 0 0 20px; padding: 0;">
            <li>Review your account activity</li>
            <li>Change your password if you notice anything unusual</li>
            <li>Revoke any suspicious sessions</li>
            <li>Contact support if needed</li>
          </ul>
        `;
    }
    
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Suspicious Activity Alert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px;">
    <h1 style="color: #dc3545; margin-top: 0;">⚠️ Suspicious Activity Alert</h1>
    
    <p>${greeting}</p>
    
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      ${activityDescription}
      <p><strong>Time:</strong> ${formattedTime}</p>
    </div>
    
    <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">📋 Recommended Actions:</p>
      ${recommendedActions}
    </div>
    
    <div style="background-color: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-weight: bold;">🔒 If you suspect unauthorized access:</p>
      <ul style="margin: 10px 0 0 20px; padding: 0;">
        <li>Change your password immediately</li>
        <li>Revoke all sessions from your account settings</li>
        <li>Regenerate your TOTP backup codes</li>
        <li>Contact support for additional assistance</li>
      </ul>
    </div>
    
    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      This is an automated security notification from void. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `.trim();
  }
}
