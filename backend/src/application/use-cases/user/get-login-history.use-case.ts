import { IAuditLogRepository } from '../../interfaces/index.js';

export interface GetLoginHistoryResult {
  logs: Array<{
    id: string;
    eventType: string;
    success: boolean;
    ipAddress?: string;
    userAgent?: string;
    eventData?: Record<string, any>;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
}

export interface GetLoginHistoryDTO {
  page?: number;
  limit?: number;
  eventType?: string;
}

export class GetLoginHistoryUseCase {
  constructor(private auditLogRepository: IAuditLogRepository) {}

  async execute(userId: string, dto: GetLoginHistoryDTO = {}): Promise<GetLoginHistoryResult> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 50;

    const allowedEventTypes = ['LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'TOKEN_REFRESH', 'TOKEN_REFRESH_FAILED'];
    const eventType = dto.eventType && allowedEventTypes.includes(dto.eventType) ? dto.eventType : undefined;

    const { logs, total } = await this.auditLogRepository.findByUserId(userId, {
      page,
      limit,
      eventType,
    });

    return {
      logs: logs.map((log) => ({
        id: log.id,
        eventType: log.eventType,
        success: log.success,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        eventData: log.eventData,
        createdAt: log.createdAt,
      })),
      total,
      page,
      limit,
    };
  }
}




