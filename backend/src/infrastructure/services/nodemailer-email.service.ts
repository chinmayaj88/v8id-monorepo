/**
 * Nodemailer Email Service Implementation
 * 
 * Production implementation using Nodemailer with Gmail SMTP.
 * Uses App Password authentication method.
 */

import nodemailer, { type Transporter } from 'nodemailer';
import { IEmailService } from '../../application/interfaces/email-service.interface.js';

export class NodemailerEmailService implements IEmailService {
  private transporter: Transporter;
  private fromEmail: string;

  constructor() {
    const emailHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const emailSecure = process.env.SMTP_SECURE === 'true';
    const emailUser = process.env.SMTP_USER;
    const emailPassword = process.env.SMTP_PASSWORD;

    if (!emailUser || !emailPassword) {
      throw new Error(
        'Email authentication not configured. Provide SMTP_USER and SMTP_PASSWORD environment variables.'
      );
    }

    this.fromEmail = process.env.EMAIL_FROM || emailUser;

    // Create transporter with App Password
    this.transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailSecure,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });

    // Verify connection (async, non-blocking)
    this.transporter.verify().catch((error) => {
      console.error('SMTP connection verification failed:', error);
    });
  }


  async sendPasswordResetEmail(
    to: string,
    _resetToken: string,
    resetLink: string
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: 'Reset Your Password - v8id-cloud',
        html: this.getPasswordResetEmailTemplate(resetLink),
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error(`Failed to send password reset email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendWelcomeEmail(
    to: string,
    firstName?: string,
    tempPassword?: string
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: 'Welcome to v8id-cloud',
        html: this.getWelcomeEmailTemplate(firstName, tempPassword),
      });
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
      await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: 'Password Changed - v8id-cloud',
        html: this.getPasswordChangeNotificationTemplate(firstName, ipAddress, userAgent),
      });
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
      await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: 'New Device Login Alert - v8id-cloud',
        html: this.getNewDeviceLoginAlertTemplate(
          firstName,
          deviceType,
          deviceName,
          ipAddress,
          location
        ),
      });
    } catch (error) {
      console.error('Failed to send new device login alert:', error);
      throw new Error('Failed to send new device login alert');
    }
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
      await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: '⚠️ Suspicious Activity Detected - v8id-cloud',
        html: this.getSuspiciousActivityAlertTemplate(
          firstName,
          activityType,
          details,
          timestamp,
          ipAddress
        ),
      });
    } catch (error) {
      console.error('Failed to send suspicious activity alert email:', error);
      throw new Error(`Failed to send suspicious activity alert email: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

  private getWelcomeEmailTemplate(firstName?: string, tempPassword?: string): string {
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
      This is an automated security notification from v8id-cloud. Please do not reply to this email.
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
    
    <p>A new device has logged into your v8id-cloud account.</p>
    
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
      This is an automated security notification from v8id-cloud. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `.trim();
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
      This is an automated security notification from v8id-cloud. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
    `.trim();
  }
}
