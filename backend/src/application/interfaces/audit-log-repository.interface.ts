/**
 * Audit Log Repository Interface
 * 
 * Defines the contract for audit log data access operations.
 */

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
  /**
   * Create a new audit log entry
   */
  create(data: {
    userId?: string;
    eventType: string;
    eventData?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
  }): Promise<AuditLog>;

  /**
   * Find audit logs by user ID
   */
  findByUserId(userId: string, options?: {
    page?: number;
    limit?: number;
    eventType?: string;
  }): Promise<{ logs: AuditLog[]; total: number }>;

  /**
   * Find audit logs by event type
   */
  findByEventType(eventType: string, options?: {
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLog[]; total: number }>;

  /**
   * Find failed login attempts for a user
   */
  findFailedLoginAttempts(userId: string, since?: Date): Promise<AuditLog[]>;
}
