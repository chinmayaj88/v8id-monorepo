/**
 * Infrastructure Services
 * 
 * External services and utilities used by the infrastructure layer.
 */

export { PasswordService } from './password.service.js';
export { JwtService } from './jwt.service.js';
export { TotpService } from './totp.service.js';
export { AuditLogService, AuditEventType } from './audit-log.service.js';
export { EmailServiceFactory } from './email.service.factory.js';
export { NodemailerEmailService } from './nodemailer-email.service.js';
export { ConsoleEmailService } from './console-email.service.js';
export { UrlCacheService } from './url-cache.service.js';
export { StorageCacheService } from './storage-cache.service.js';
export { ThumbnailService } from './thumbnail.service.js';
export { SuspiciousActivityService } from './suspicious-activity.service.js';

// Re-export types from interfaces for convenience
export type { TokenPayload } from '../../application/interfaces/jwt-service.interface.js';
export type { TotpSetupResult } from '../../application/interfaces/totp-service.interface.js';
export type { SuspiciousActivityDetectionResult } from '../../application/interfaces/suspicious-activity-service.interface.js';

