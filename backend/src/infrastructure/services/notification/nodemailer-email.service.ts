/**
 * Nodemailer Email Service Implementation
 *
 * Production implementation using Nodemailer with Gmail SMTP.
 * Uses App Password authentication method.
 */

import nodemailer, { type Transporter } from 'nodemailer';
import { IEmailService } from '../../../application/interfaces/index.js';

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

    // Verify connection
    this.transporter
      .verify()
      .then(() => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('📧 SMTP connection verified successfully');
        }
      })
      .catch(error => {
        console.error('❌ SMTP connection verification failed:', error);
      });
  }

  async sendPasswordResetEmail(to: string, _resetToken: string, resetLink: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject: 'Reset Your Password - v8id-cloud',
        html: this.getPasswordResetEmailTemplate(resetLink),
      });
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new Error(
        `Failed to send password reset email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async sendWelcomeEmail(to: string, firstName?: string, tempPassword?: string): Promise<void> {
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
      throw new Error(
        `Failed to send suspicious activity alert email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private getCommonStyles(): string {
    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
        table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
        table { border-collapse: collapse !important; }
        body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        
        .card {
          background-color: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        
        .header {
          padding: 32px 0;
          text-align: center;
          background: linear-gradient(135deg, #7c3aed 0%, #6366f1 100%);
        }
        
        .content {
          padding: 40px;
        }
        
        .footer {
          padding: 32px;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }
        
        .btn {
          display: inline-block;
          padding: 14px 32px;
          background-color: #7c3aed;
          color: #ffffff !important;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          transition: background-color 0.3s ease;
        }
        
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 500;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        
        .badge-warning { background-color: #fef3c7; color: #92400e; }
        .badge-danger { background-color: #fee2e2; color: #b91c1c; }
        .badge-info { background-color: #e0e7ff; color: #4338ca; }
        
        h1 { color: #0f172a; font-size: 24px; font-weight: 700; margin-top: 0; margin-bottom: 16px; }
        p { color: #475569; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px; }
        
        .info-box {
          background-color: #f1f5f9;
          border-left: 4px solid #7c3aed;
          padding: 20px;
          border-radius: 0 8px 8px 0;
          margin: 24px 0;
        }
        
        .code {
          font-family: 'SF Mono', 'Fira Code', monospace;
          background-color: #f1f5f9;
          padding: 2px 6px;
          border-radius: 4px;
          color: #7c3aed;
        }
      </style>
    `;
  }

  private wrapInBaseTemplate(content: string, previewText: string): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://v8id.cloud';
    const logoUrl = `${appUrl}/images/v8id-logo.png`;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>v8id-cloud</title>
  ${this.getCommonStyles()}
</head>
<body>
  <div style="display: none; max-height: 0px; overflow: hidden;">
    ${previewText}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table class="card" role="presentation" width="100%" style="max-width: 600px;" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td class="header">
              <img src="${logoUrl}" alt="v8id-cloud Logo" width="120" style="display: block; margin: 0 auto;">
            </td>
          </tr>
          <tr>
            <td class="content">
              ${content}
            </td>
          </tr>
          <tr>
            <td class="footer">
              <p style="margin-bottom: 16px;">&copy; ${new Date().getFullYear()} v8id-cloud. All rights reserved.</p>
              <div style="margin-bottom: 16px;">
                <a href="#" style="color: #64748b; text-decoration: none; margin: 0 10px;">Privacy Policy</a>
                <a href="#" style="color: #64748b; text-decoration: none; margin: 0 10px;">Terms of Service</a>
                <a href="#" style="color: #64748b; text-decoration: none; margin: 0 10px;">Support</a>
              </div>
              <p style="font-size: 12px; color: #94a3b8;">
                You are receiving this email because you have a v8id-cloud account.<br>
                If this wasn't you, please ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  private getPasswordResetEmailTemplate(resetLink: string): string {
    const content = `
      <div class="badge badge-info">Security</div>
      <h1>Reset Your Password</h1>
      <p>Hello,</p>
      <p>We received a request to reset the password for your v8id-cloud account. No problem, just click the button below to set up a new one.</p>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${resetLink}" class="btn">Reset Password</a>
      </div>
      
      <p>This link will expire in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email; your password will remain unchanged.</p>
      
      <div class="info-box" style="font-size: 14px; color: #64748b;">
        <strong>Trouble with the button?</strong><br>
        Copy and paste this link into your browser:<br>
        <a href="${resetLink}" style="color: #7c3aed; word-break: break-all;">${resetLink}</a>
      </div>
    `;

    return this.wrapInBaseTemplate(content, 'Reset your v8id-cloud password');
  }

  private getWelcomeEmailTemplate(firstName?: string, tempPassword?: string): string {
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://v8id.cloud';

    const content = `
      <div class="badge badge-info">Welcome</div>
      <h1>Welcome to v8id-cloud!</h1>
      <p>${greeting}</p>
      <p>We're thrilled to have you on board. Your account is now active and ready for secure document storage.</p>
      
      <div style="margin: 32px 0; text-align: center;">
        <img src="${appUrl}/images/vault.png" alt="Secure Vault" width="280" style="border-radius: 12px; max-width: 100%;">
      </div>
      
      ${
        tempPassword
          ? `
      <div class="info-box">
        <p style="margin-bottom: 8px; font-weight: 600; color: #b45309;">Temporary Password:</p>
        <p style="font-family: monospace; font-size: 20px; letter-spacing: 2px; color: #0f172a; margin: 0;">${tempPassword}</p>
        <p style="font-size: 13px; color: #64748b; margin-top: 8px;">Please update this immediately after your first login.</p>
      </div>
      `
          : ''
      }
      
      <h2 style="font-size: 18px; color: #0f172a; margin-bottom: 16px;">Getting Started:</h2>
      <ul style="color: #475569; padding-left: 20px; line-height: 1.8;">
        <li>Set up your 2FA using an authenticator app.</li>
        <li>Securely upload and manage your sensitive documents.</li>
        <li>Share files with encryption-backed links.</li>
      </ul>
      
      <div style="text-align: center; margin: 40px 0;">
        <a href="${appUrl}/login" class="btn">Launch Dashboard</a>
      </div>
    `;

    return this.wrapInBaseTemplate(content, 'Welcome to your secure cloud storage');
  }

  private getPasswordChangeNotificationTemplate(
    firstName?: string,
    ipAddress?: string,
    userAgent?: string
  ): string {
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const content = `
      <div class="badge badge-info">Security Update</div>
      <h1>Password Changed Successfully</h1>
      <p>${greeting}</p>
      <p>This is a confirmation that your password was recently updated. If you made this change, you can safely ignore this email.</p>
      
      <div class="info-box">
        <p style="margin: 0; font-weight: 600; color: #0f172a;">Review the details:</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 12px;">
          <tr>
            <td style="padding: 4px 0; color: #64748b; font-size: 14px;" width="100">Time:</td>
            <td style="padding: 4px 0; color: #0f172a; font-size: 14px;">${timestamp}</td>
          </tr>
          ${
            ipAddress
              ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b; font-size: 14px;">IP Address:</td>
            <td style="padding: 4px 0; color: #0f172a; font-size: 14px;">${ipAddress}</td>
          </tr>`
              : ''
          }
          ${
            userAgent
              ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Device:</td>
            <td style="padding: 4px 0; color: #0f172a; font-size: 14px;">${userAgent}</td>
          </tr>`
              : ''
          }
        </table>
      </div>
      
      <div style="background-color: #fee2e2; border-radius: 8px; padding: 20px; margin-top: 24px;">
        <p style="margin: 0; font-weight: 600; color: #b91c1c;">Didn't make this change?</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #7f1d1d;">
          Please contact our security team immediately at <strong>support@v8id.cloud</strong> or reset your password using the "Forgot Password" link on the login page.
        </p>
      </div>
    `;

    return this.wrapInBaseTemplate(content, 'Your password was successfully updated');
  }

  private getNewDeviceLoginAlertTemplate(
    firstName: string | undefined,
    deviceType: string,
    deviceName: string,
    ipAddress?: string,
    location?: string
  ): string {
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const content = `
      <div class="badge badge-warning">Security Alert</div>
      <h1>New Device Login</h1>
      <p>${greeting}</p>
      <p>We detected a new login to your v8id-cloud account from a device we don't recognize.</p>
      
      <div class="info-box">
        <p style="margin: 0 0 12px 0; font-weight: 600; color: #0f172a;">Login Details:</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding: 4px 0; color: #64748b; font-size: 14px;" width="100">Device:</td>
            <td style="padding: 4px 0; color: #0f172a; font-size: 14px;">${deviceType} (${deviceName})</td>
          </tr>
          ${
            ipAddress
              ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b; font-size: 14px;">IP Address:</td>
            <td style="padding: 4px 0; color: #0f172a; font-size: 14px;">${ipAddress}</td>
          </tr>`
              : ''
          }
          ${
            location
              ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Location:</td>
            <td style="padding: 4px 0; color: #0f172a; font-size: 14px;">${location}</td>
          </tr>`
              : ''
          }
          <tr>
            <td style="padding: 4px 0; color: #64748b; font-size: 14px;">Time:</td>
            <td style="padding: 4px 0; color: #0f172a; font-size: 14px;">${timestamp}</td>
          </tr>
        </table>
      </div>
      
      <p style="font-weight: 600; color: #0f172a; margin-top: 24px;">If this was you:</p>
      <p>You can safely ignore this email. We'll remember this device for future logins.</p>
      
      <div style="background-color: #fee2e2; border-radius: 8px; padding: 20px; margin-top: 24px;">
        <p style="margin: 0; font-weight: 600; color: #b91c1c;">If this wasn't you:</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #7f1d1d;">
          Please change your password immediately and revoke any unfamiliar active sessions from your security settings.
        </p>
      </div>
    `;

    return this.wrapInBaseTemplate(content, 'New device login detected for your account');
  }

  private getSuspiciousActivityAlertTemplate(
    firstName: string | undefined,
    activityType: string,
    details: Record<string, any>,
    timestamp: Date,
    ipAddress?: string
  ): string {
    const greeting = firstName ? `Hello ${firstName},` : 'Hello,';
    const formattedTime = timestamp.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    let activityTitle = 'Suspicious Activity Detected';
    let activityDescription = '';
    let recommendations = '';

    switch (activityType) {
      case 'MULTIPLE_FAILED_LOGINS':
        activityTitle = 'Multiple Failed Logins';
        activityDescription = `We detected ${details.count || 'multiple'} failed login attempts on your account within a short period.`;
        recommendations = `
          <li>Verify you are using the correct credentials and 2FA code.</li>
          <li>If you haven't tried logging in, your account may be under attempt to be accessed.</li>
          <li>We recommend changing your password as a precaution.</li>
        `;
        break;
      case 'MULTIPLE_FAILED_TOTP':
        activityTitle = '2FA Verification Failures';
        activityDescription = `There have been ${details.count || 'multiple'} unsuccessful attempts to verify your 2FA code.`;
        recommendations = `
          <li>Check that your authenticator app time is synchronized.</li>
          <li>If this was not you, someone may have your password and is trying to bypass security.</li>
          <li>Change your password immediately.</li>
        `;
        break;
      case 'UNUSUAL_LOCATION':
        activityTitle = 'Login from Unusual Location';
        activityDescription = `Your account was accessed from a location that differs from your usual patterns.`;
        recommendations = `
          <li>If you are traveling or using a VPN, you can ignore this alert.</li>
          <li>If not, logout all active sessions and update your password.</li>
        `;
        break;
      default:
        activityDescription = `Unusual activity was flagged on your account that requires review.`;
        recommendations = `
          <li>Review your recent account activity logs.</li>
          <li>Ensure your security settings are up to date.</li>
        `;
    }

    const content = `
      <div class="badge badge-danger">High Priority Alert</div>
      <h1 style="color: #dc3545;">⚠️ ${activityTitle}</h1>
      <p>${greeting}</p>
      <div class="info-box" style="background-color: #fff7ed; border-left-color: #f97316;">
        <p style="margin: 0; color: #9a3412;">${activityDescription}</p>
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #c2410c;">
          <strong>Time:</strong> ${formattedTime}<br>
          ${ipAddress ? `<strong>IP Address:</strong> ${ipAddress}` : ''}
        </p>
      </div>
      
      <h2 style="font-size: 18px; color: #0f172a; margin-top: 32px; margin-bottom: 16px;">Recommended Actions:</h2>
      <ul style="color: #475569; padding-left: 20px; line-height: 1.8;">
        ${recommendations}
      </ul>
      
      <div style="margin-top: 40px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 32px;">
        <a href="mailto:support@v8id.cloud" style="color: #7c3aed; font-weight: 600; text-decoration: none;">Contact Security Team &rarr;</a>
      </div>
    `;

    return this.wrapInBaseTemplate(content, 'Immediate Action Required: Security Alert');
  }
}
