/**
 * Verify TOTP Login Use Case
 *
 * Second step of two-step login: Verifies TOTP code and completes login.
 */

import { IUserRepository } from '../../interfaces/index.js';
import { IDeviceSessionRepository } from '../../interfaces/index.js';
import { IEmailService } from '../../interfaces/index.js';
import { ITotpService } from '../../interfaces/index.js';
import { IJwtService } from '../../interfaces/index.js';
import { ISuspiciousActivityService } from '../../interfaces/index.js';
import { IAuditLogService } from '../../interfaces/index.js';
import { IStorageService } from '../../interfaces/index.js';
import { ConfigServiceFactory } from '../../../infrastructure/config/config-service.factory.js';

export interface VerifyTotpLoginResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  deviceSession: {
    id: string;
    deviceType: 'MOBILE' | 'WEB';
    deviceName: string;
    location?: string;
  };
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    role: string;
    storageQuota: string;
    storageUsed: string;
  };
}

export interface VerifyTotpLoginDTO {
  tempToken: string;
  totpCode: string;
  deviceType: 'MOBILE' | 'WEB';
  deviceName: string;
  deviceId: string;
  rememberMe?: boolean;
}

export interface VerifyTotpLoginOptions {
  ipAddress?: string;
  userAgent?: string;
}

export class VerifyTotpLoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private deviceSessionRepository: IDeviceSessionRepository,
    private emailService: IEmailService,
    private totpService: ITotpService,
    private jwtService: IJwtService,
    private suspiciousActivityService: ISuspiciousActivityService,
    private auditLogService: IAuditLogService,
    private storageService: IStorageService
  ) {}

  async execute(
    dto: VerifyTotpLoginDTO,
    options?: VerifyTotpLoginOptions
  ): Promise<VerifyTotpLoginResult> {
    const ipAddress = options?.ipAddress;
    const userAgent = options?.userAgent;
    let tokenPayload;
    try {
      tokenPayload = this.jwtService.verifyToken(dto.tempToken);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid or expired token';
      if (errorMessage.includes('expired') || errorMessage.includes('jwt expired')) {
        throw new Error('Temporary token has expired. Please verify credentials again.');
      }
      throw new Error('Invalid or expired temporary token');
    }

    const user = await this.userRepository.findById(tokenPayload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isUserActive()) {
      throw new Error('Account is inactive');
    }

    if (!user.totpSecret) {
      throw new Error('TOTP is not set up for this account');
    }

    const config = ConfigServiceFactory.getInstance();
    const encryptionKey = config.getRequired('TOTP_ENCRYPTION_KEY');
    let totpSecret: string;
    try {
      totpSecret = this.totpService.decryptSecret(user.totpSecret, encryptionKey);
    } catch {
      throw new Error('Invalid TOTP configuration');
    }

    const isTotpValid = this.totpService.verifyTotp(dto.totpCode, totpSecret);
    if (!isTotpValid) {
      await this.auditLogService.logTotpVerification(user.id, false, {
        ipAddress: ipAddress,
        userAgent: userAgent,
        errorMessage: 'Invalid TOTP code',
      });

      const suspiciousActivity = await this.suspiciousActivityService.detectFailedTotpPattern(
        user.id,
        ipAddress
      );

      if (
        suspiciousActivity.isSuspicious &&
        suspiciousActivity.activityType === 'MULTIPLE_FAILED_TOTP'
      ) {
        try {
          await this.emailService.sendSuspiciousActivityAlert(
            user.email,
            user.firstName,
            suspiciousActivity.activityType,
            suspiciousActivity.details || {},
            new Date(),
            ipAddress
          );
        } catch (error) {
          console.error('Failed to send suspicious activity alert:', error);
        }
      }

      throw new Error('Invalid TOTP code');
    }

    await this.auditLogService.logTotpVerification(user.id, true, {
      ipAddress: ipAddress,
      userAgent: userAgent,
    });

    const unusualLocation = await this.suspiciousActivityService.detectUnusualLocation(
      user.id,
      ipAddress,
      undefined
    );

    if (unusualLocation.isSuspicious && unusualLocation.activityType === 'UNUSUAL_LOCATION') {
      try {
        await this.emailService.sendSuspiciousActivityAlert(
          user.email,
          user.firstName,
          unusualLocation.activityType,
          unusualLocation.details || {},
          new Date(),
          ipAddress
        );
      } catch (error) {
        console.error('Failed to send suspicious activity alert:', error);
      }
    }

    if (!user.totpVerified) {
      await this.userRepository.update(user.id, {
        totpVerified: true,
      });
    }

    const rememberMe = dto.rememberMe ?? false;

    if (rememberMe) {
      if (dto.deviceType === 'WEB') {
        throw new Error('Remember Me is only available on mobile devices');
      }

      if (dto.deviceType === 'MOBILE') {
        const existingRememberedSession =
          await this.deviceSessionRepository.findRememberedMobileSession(user.id);
        if (existingRememberedSession) {
          throw new Error(
            'Remember Me can only be used on one mobile device. You already have a remembered device. Please revoke it first.'
          );
        }
      }
    }

    const activeSessions = await this.deviceSessionRepository.findActiveSessionsByUserId(user.id);
    const mobileCount = await this.deviceSessionRepository.countActiveSessionsByType(
      user.id,
      'MOBILE'
    );
    const webCount = await this.deviceSessionRepository.countActiveSessionsByType(user.id, 'WEB');

    const isNewDevice = !activeSessions.some(s => s.deviceId === dto.deviceId);

    if (dto.deviceType === 'MOBILE' && mobileCount >= 2) {
      const mobileSessions = activeSessions
        .filter(s => s.deviceType === 'MOBILE')
        .sort((a, b) => a.lastActiveAt.getTime() - b.lastActiveAt.getTime());
      if (mobileSessions.length > 0 && mobileSessions[0]) {
        await this.deviceSessionRepository.revoke(mobileSessions[0].id);
      }
    } else if (dto.deviceType === 'WEB' && webCount >= 1) {
      const webSessions = activeSessions.filter(s => s.deviceType === 'WEB');
      for (const session of webSessions) {
        await this.deviceSessionRepository.revoke(session.id);
      }
    }

    const finalTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = this.jwtService.generateAccessToken(finalTokenPayload);
    const refreshToken = this.jwtService.generateRefreshToken(finalTokenPayload);
    const expiresIn = this.jwtService.getAccessTokenExpirationSeconds();

    const expiresAt = new Date();
    if (rememberMe) {
      expiresAt.setDate(expiresAt.getDate() + 30);
    } else {
      expiresAt.setDate(expiresAt.getDate() + 7);
    }

    const deviceSession = await this.deviceSessionRepository.create({
      userId: user.id,
      deviceType: dto.deviceType,
      deviceName: dto.deviceName,
      deviceId: dto.deviceId,
      userAgent: userAgent || dto.deviceName,
      ipAddress: ipAddress,
      location: undefined,
      accessToken,
      refreshToken,
      expiresAt,
      rememberMe,
    });

    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    if (isNewDevice) {
      try {
        await this.emailService.sendNewDeviceLoginAlert(
          user.email,
          user.firstName,
          dto.deviceType,
          dto.deviceName,
          ipAddress,
          deviceSession.location
        );
      } catch (error) {
        console.error('Failed to send new device login alert:', error);
      }
    }

    // Generate avatar URL if exists (valid for 7 days)
    let avatarUrl: string | undefined;
    if (user.avatarPath) {
      try {
        avatarUrl = await this.storageService.generatePresignedUrl(user.avatarPath, 604800);
      } catch (error) {
        console.error('Failed to generate avatar URL:', error);
      }
    }

    return {
      accessToken,
      refreshToken,
      expiresIn,
      deviceSession: {
        id: deviceSession.id,
        deviceType: deviceSession.deviceType,
        deviceName: deviceSession.deviceName,
        location: deviceSession.location,
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl,
        role: user.role,
        storageQuota: user.storageQuota.toString(),
        storageUsed: user.storageUsed.toString(),
      },
    };
  }
}




