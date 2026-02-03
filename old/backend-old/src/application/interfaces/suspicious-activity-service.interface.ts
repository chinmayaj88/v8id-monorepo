export interface SuspiciousActivityDetectionResult {
  isSuspicious: boolean;
  activityType: 'MULTIPLE_FAILED_LOGINS' | 'MULTIPLE_FAILED_TOTP' | 'UNUSUAL_LOCATION' | 'SESSION_REVOKED_REMOTELY' | null;
  details?: Record<string, any>;
}

export interface ISuspiciousActivityService {
  detectFailedLoginPattern(userId: string | undefined, ipAddress?: string): Promise<SuspiciousActivityDetectionResult>;
  
  detectFailedTotpPattern(userId: string, ipAddress?: string): Promise<SuspiciousActivityDetectionResult>;
  
  detectUnusualLocation(userId: string, ipAddress?: string, location?: string): Promise<SuspiciousActivityDetectionResult>;
}
