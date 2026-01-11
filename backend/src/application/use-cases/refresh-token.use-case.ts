/**
 * Refresh Token Use Case
 * 
 * Refreshes an access token using a valid refresh token.
 */

import { IDeviceSessionRepository } from '../interfaces/device-session-repository.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { IJwtService } from '../interfaces/jwt-service.interface';
import { IAuditLogService } from '../interfaces/audit-log-service.interface';
import { RefreshTokenDTO } from '../dtos/auth.dto';

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string; // New rotated refresh token
  expiresIn: number;
}

export class RefreshTokenUseCase {
  constructor(
    private deviceSessionRepository: IDeviceSessionRepository,
    private userRepository: IUserRepository,
    private jwtService: IJwtService,
    private auditLogService: IAuditLogService
  ) {}

  async execute(dto: RefreshTokenDTO): Promise<RefreshTokenResult> {
    // 1. Verify refresh token
    let payload;
    try {
      payload = this.jwtService.verifyToken(dto.refreshToken);
    } catch (_error) {
      throw new Error('Invalid or expired refresh token');
    }

    // 2. Find device session by refresh token
    const session = await this.deviceSessionRepository.findByRefreshToken(
      dto.refreshToken
    );
    if (!session) {
      throw new Error('Session not found');
    }

    // 3. Check if session is active and not revoked
    if (!session.isActive || session.isRevoked) {
      throw new Error('Session is revoked');
    }

    // 4. Check if session is expired
    if (session.expiresAt < new Date()) {
      throw new Error('Session expired');
    }

    // 5. Get user to get current tokenVersion
    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // 6. Verify token version matches (password change invalidates tokens)
    if (payload.tokenVersion !== undefined && payload.tokenVersion !== user.tokenVersion) {
      throw new Error('Token has been invalidated. Please login again.');
    }

    // 7. Generate new tokens (TOKEN ROTATION: rotate both access and refresh tokens)
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = this.jwtService.generateAccessToken(tokenPayload);
    const refreshToken = this.jwtService.generateRefreshToken(tokenPayload); // New refresh token
    const expiresIn = this.jwtService.getAccessTokenExpirationSeconds();

    // 8. Update session with new tokens (token rotation)
    await this.deviceSessionRepository.updateTokens(session.id, accessToken, refreshToken);

    // 9. Log successful token refresh
    await this.auditLogService.logTokenRefresh(user.id, true);

    return {
      accessToken,
      refreshToken, // Return new refresh token
      expiresIn,
    };
  }
}

