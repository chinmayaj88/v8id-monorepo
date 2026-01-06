/**
 * Refresh Token Use Case
 * 
 * Refreshes an access token using a valid refresh token.
 */

import { IDeviceSessionRepository } from '../interfaces/device-session-repository.interface';
import { JwtService } from '../../infrastructure/services/jwt.service';
import { RefreshTokenDTO } from '../dtos/auth.dto';

export interface RefreshTokenResult {
  accessToken: string;
  expiresIn: number;
}

export class RefreshTokenUseCase {
  constructor(
    private deviceSessionRepository: IDeviceSessionRepository
  ) {}

  async execute(dto: RefreshTokenDTO): Promise<RefreshTokenResult> {
    // 1. Verify refresh token
    let payload;
    try {
      payload = JwtService.verifyToken(dto.refreshToken);
    } catch (error) {
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

    // 5. Update last active time
    await this.deviceSessionRepository.updateLastActive(session.id);

    // 6. Generate new access token
    const tokenPayload = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    const accessToken = JwtService.generateAccessToken(tokenPayload);
    const expiresIn = JwtService.getAccessTokenExpirationSeconds();

    return {
      accessToken,
      expiresIn,
    };
  }
}

