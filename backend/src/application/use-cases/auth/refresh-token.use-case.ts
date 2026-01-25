/**
 * Refresh Token Use Case
 * 
 * Refreshes an access token using a valid refresh token.
 */

import { IDeviceSessionRepository } from '../../interfaces/index.js';
import { IUserRepository } from '../../interfaces/index.js';
import { IJwtService } from '../../interfaces/index.js';
import { IAuditLogService } from '../../interfaces/index.js';
import { RefreshTokenDTO } from '../../dtos/index.js';

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
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
    let payload;
    try {
      payload = this.jwtService.verifyToken(dto.refreshToken);
    } catch (_error) {
      throw new Error('Invalid or expired refresh token');
    }

    const session = await this.deviceSessionRepository.findByRefreshToken(
      dto.refreshToken
    );
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.isActive || session.isRevoked) {
      throw new Error('Session is revoked');
    }

    if (session.expiresAt < new Date()) {
      throw new Error('Session expired');
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (payload.tokenVersion !== undefined && payload.tokenVersion !== user.tokenVersion) {
      throw new Error('Token has been invalidated. Please login again.');
    }

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const accessToken = this.jwtService.generateAccessToken(tokenPayload);
    const refreshToken = this.jwtService.generateRefreshToken(tokenPayload);
    const expiresIn = this.jwtService.getAccessTokenExpirationSeconds();

    await this.deviceSessionRepository.updateTokens(session.id, accessToken, refreshToken);

    await this.auditLogService.logTokenRefresh(user.id, true);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }
}





