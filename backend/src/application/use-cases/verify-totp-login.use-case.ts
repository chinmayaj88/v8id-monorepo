/**
 * Verify TOTP Login Use Case
 * 
 * Second step of two-step login: Verifies TOTP code and completes login.
 */

import { IUserRepository } from '../interfaces/user-repository.interface';
import { IDeviceSessionRepository } from '../interfaces/device-session-repository.interface';
import { TotpService } from '../../infrastructure/services/totp.service';
import { JwtService } from '../../infrastructure/services/jwt.service';

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
    role: string;
  };
}

export interface VerifyTotpLoginDTO {
  tempToken: string;
  totpCode: string;
  deviceType: 'MOBILE' | 'WEB';
  deviceName: string;
  deviceId: string;
}

export class VerifyTotpLoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private deviceSessionRepository: IDeviceSessionRepository
  ) {}

  async execute(dto: VerifyTotpLoginDTO, ipAddress?: string): Promise<VerifyTotpLoginResult> {
    // 1. Verify temporary token
    let tokenPayload;
    try {
      tokenPayload = JwtService.verifyToken(dto.tempToken);
    } catch (error) {
      throw new Error('Invalid or expired temporary token');
    }

    // 2. Get user
    const user = await this.userRepository.findById(tokenPayload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 3. Check if user is active
    if (!user.isUserActive()) {
      throw new Error('Account is inactive');
    }

    // 4. Verify TOTP is set up (TOTP is mandatory)
    if (!user.totpSecret) {
      throw new Error('TOTP is not set up for this account');
    }

    // 5. Verify TOTP code
    if (!user.totpSecret) {
      throw new Error('TOTP secret is missing');
    }

    const encryptionKey = process.env.TOTP_ENCRYPTION_KEY || 'default-key-change-in-production';
    let totpSecret: string;
    try {
      totpSecret = TotpService.decryptSecret(user.totpSecret, encryptionKey);
    } catch {
      throw new Error('Invalid TOTP configuration');
    }

    const isTotpValid = TotpService.verifyTotp(dto.totpCode, totpSecret);
    if (!isTotpValid) {
      throw new Error('Invalid TOTP code');
    }

    // 6. If TOTP was not verified before, mark it as verified now
    if (!user.totpVerified) {
      await this.userRepository.update(user.id, {
        totpVerified: true,
      });
    }

    // 7. Check device limits
    const activeSessions = await this.deviceSessionRepository.findActiveSessionsByUserId(user.id);
    const mobileCount = await this.deviceSessionRepository.countActiveSessionsByType(user.id, 'MOBILE');
    const webCount = await this.deviceSessionRepository.countActiveSessionsByType(user.id, 'WEB');

    // Enforce limits: 2 mobile + 1 web
    if (dto.deviceType === 'MOBILE' && mobileCount >= 2) {
      const mobileSessions = activeSessions
        .filter((s) => s.deviceType === 'MOBILE')
        .sort((a, b) => a.lastActiveAt.getTime() - b.lastActiveAt.getTime());
      if (mobileSessions.length > 0 && mobileSessions[0]) {
        await this.deviceSessionRepository.revoke(mobileSessions[0].id);
      }
    } else if (dto.deviceType === 'WEB' && webCount >= 1) {
      const webSessions = activeSessions.filter((s) => s.deviceType === 'WEB');
      for (const session of webSessions) {
        await this.deviceSessionRepository.revoke(session.id);
      }
    }

    // 8. Generate tokens
    const finalTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = JwtService.generateAccessToken(finalTokenPayload);
    const refreshToken = JwtService.generateRefreshToken(finalTokenPayload);
    const expiresIn = JwtService.getAccessTokenExpirationSeconds();

    // 9. Calculate expiration date for refresh token (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 10. Create device session
    const deviceSession = await this.deviceSessionRepository.create({
      userId: user.id,
      deviceType: dto.deviceType,
      deviceName: dto.deviceName,
      deviceId: dto.deviceId,
      userAgent: dto.deviceName,
      ipAddress: ipAddress,
      location: undefined,
      accessToken,
      refreshToken,
      expiresAt,
    });

    // 11. Update user's last login time
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

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
        role: user.role,
      },
    };
  }
}

