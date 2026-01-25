export interface IEmailService {
  sendPasswordResetEmail(
    to: string,
    resetToken: string,
    resetLink: string
  ): Promise<void>;

  sendWelcomeEmail(
    to: string,
    firstName?: string,
    tempPassword?: string
  ): Promise<void>;

  sendPasswordChangeNotification(
    to: string,
    firstName?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void>;

  sendNewDeviceLoginAlert(
    to: string,
    firstName: string | undefined,
    deviceType: string,
    deviceName: string,
    ipAddress?: string,
    location?: string
  ): Promise<void>;

  sendSuspiciousActivityAlert(
    to: string,
    firstName: string | undefined,
    activityType: string,
    details: Record<string, any>,
    timestamp: Date,
    ipAddress?: string
  ): Promise<void>;
}


