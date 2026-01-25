export interface AuditLog {
  id: string;
  userId?: string;
  eventType: string;
  eventData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorMessage?: string;
  createdAt: Date;
}

export interface IAuditLogRepository {

  create(data: {
    userId?: string;
    eventType: string;
    eventData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
  }): Promise<AuditLog>;


  findByUserId(userId: string, options?: {
    page?: number;
    limit?: number;
    eventType?: string;
  }): Promise<{ logs: AuditLog[]; total: number }>;


  findByEventType(eventType: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number }>;


  findFailedLoginAttempts(userId: string, since?: Date): Promise<AuditLog[]>;

  findByUserIdAndEventType(
    userId: string,
    eventType: string,
    since?: Date
  ): Promise<AuditLog[]>;
}


