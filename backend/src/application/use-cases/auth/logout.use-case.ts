/**
 * Logout Use Case
 * 
 * Logs out a user by revoking their device session.
 */

import { IDeviceSessionRepository } from '../../interfaces/index.js';
import { IAuditLogService } from '../../interfaces/index.js';

export class LogoutUseCase {
  constructor(
    private deviceSessionRepository: IDeviceSessionRepository,
    private auditLogService: IAuditLogService
  ) {}

  async execute(sessionId: string, userId: string): Promise<void> {
    // Optimized query - single query instead of fetching all sessions
    const session = await this.deviceSessionRepository.findByIdAndUserId(sessionId, userId);

    if (!session) {
      throw new Error('Session not found');
    }

    // Session ownership is already verified by findByIdAndUserId
    await this.deviceSessionRepository.revoke(sessionId);

    await this.auditLogService.logLogout(userId, {
      sessionId,
    });
  }
}





