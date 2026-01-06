/**
 * Login Use Case
 * 
 * Handles user login with email, password, and TOTP verification.
 * Enforces device limits (2 mobile + 1 web session per user).
 */

import { IUserRepository } from '../interfaces/user-repository.interface';
import { IDeviceSessionRepository } from '../interfaces/device-session-repository.interface';
import { PasswordService } from '../../infrastructure/services/password.service';
import { JwtService } from '../../infrastructure/services/jwt.service';
import { TotpService } from '../../infrastructure/services/totp.service';
import { LoginDTO } from '../dtos/auth.dto';

export interface LoginResult {
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

export class LoginUseCase {
  constructor(
    private userRepository: IUserRepository,
    private deviceSessionRepository: IDeviceSessionRepository
  ) {}

  async execute(dto: LoginDTO, ipAddress?: string): Promise<LoginResult> {
    // 1. Find user by email
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Check if user is active
    if (!user.isUserActive()) {
      throw new Error('Account is inactive');
    }

    // 3. Verify password
    const isPasswordValid = await PasswordService.verifyPassword(
      dto.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // 4. Verify TOTP (MANDATORY - all users must have TOTP secret)
    if (!user.totpSecret) {
      throw new Error('TOTP is required for all accounts');
    }

    // If TOTP is not verified yet, allow login with TOTP code to verify it
    if (!user.totpVerified) {
      // User must provide TOTP code to verify setup
      if (!dto.totpCode) {
        throw new Error('TOTP code is required to complete setup. Please scan the QR code provided during account creation.');
      }

      // Decrypt and verify TOTP
      const encryptionKey = process.env.TOTP_ENCRYPTION_KEY || 'default-key-change-in-production';
      
      if (!user.totpSecret) {
        throw new Error('TOTP secret is missing');
      }

      let totpSecret: string;
      try {
        totpSecret = TotpService.decryptSecret(user.totpSecret, encryptionKey);
      } catch {
        throw new Error('Invalid TOTP configuration');
      }

      const isTotpValid = TotpService.verifyTotp(dto.totpCode, totpSecret);
      if (!isTotpValid) {
        throw new Error('Invalid TOTP code. Please verify the code from your authenticator app.');
      }

      // Mark TOTP as verified
      await this.userRepository.update(user.id, {
        totpVerified: true,
      });
    } else {
      // TOTP is verified, require it for login
      if (!dto.totpCode) {
        throw new Error('TOTP code is required');
      }

      // Decrypt TOTP secret
      const encryptionKey = process.env.TOTP_ENCRYPTION_KEY || 'default-key-change-in-production';
      
      if (!user.totpSecret) {
        throw new Error('TOTP secret is missing');
      }

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
    }

    // 5. Check device limits
    const activeSessions = await this.deviceSessionRepository.findActiveSessionsByUserId(user.id);
    const mobileCount = await this.deviceSessionRepository.countActiveSessionsByType(user.id, 'MOBILE');
    const webCount = await this.deviceSessionRepository.countActiveSessionsByType(user.id, 'WEB');

    // Enforce limits: 2 mobile + 1 web
    if (dto.deviceType === 'MOBILE' && mobileCount >= 2) {
      // Revoke oldest mobile session
      const mobileSessions = activeSessions
        .filter((s) => s.deviceType === 'MOBILE')
        .sort((a, b) => a.lastActiveAt.getTime() - b.lastActiveAt.getTime());
      if (mobileSessions.length > 0 && mobileSessions[0]) {
        await this.deviceSessionRepository.revoke(mobileSessions[0].id);
      }
    } else if (dto.deviceType === 'WEB' && webCount >= 1) {
      // Revoke existing web session
      const webSessions = activeSessions.filter((s) => s.deviceType === 'WEB');
      for (const session of webSessions) {
        await this.deviceSessionRepository.revoke(session.id);
      }
    }

    // 6. Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = JwtService.generateAccessToken(tokenPayload);
    const refreshToken = JwtService.generateRefreshToken(tokenPayload);
    const expiresIn = JwtService.getAccessTokenExpirationSeconds();

    // 7. Calculate expiration date for refresh token (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // 8. Create device session
    const deviceSession = await this.deviceSessionRepository.create({
      userId: user.id,
      deviceType: dto.deviceType,
      deviceName: dto.deviceName,
      deviceId: dto.deviceId,
      userAgent: dto.deviceName, // In production, extract from request headers
      ipAddress: ipAddress,
      location: undefined, // In production, use IP geolocation service
      accessToken,
      refreshToken,
      expiresAt,
    });

    // 9. Update user's last login time
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

