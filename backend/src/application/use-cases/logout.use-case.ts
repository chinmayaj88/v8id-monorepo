/**
 * Logout Use Case
 * 
 * Logs out a user by revoking their device session.
 */

import { IDeviceSessionRepository } from '../interfaces/device-session-repository.interface';
import { IAuditLogService } from '../interfaces/audit-log-service.interface';

export class LogoutUseCase {
  constructor(
    private deviceSessionRepository: IDeviceSessionRepository,
    private auditLogService: IAuditLogService
  ) {}

  async execute(sessionId: string, userId: string): Promise<void> {
    const sessions = await this.deviceSessionRepository.findActiveSessionsByUserId(userId);
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    if (session.userId !== userId) {
      throw new Error('Unauthorized');
    }

    await this.deviceSessionRepository.revoke(sessionId);

    await this.auditLogService.logLogout(userId, {
      sessionId,
    });
  }
}

