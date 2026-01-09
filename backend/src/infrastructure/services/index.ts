/**
 * Infrastructure Services
 * 
 * External services and utilities used by the infrastructure layer.
 */

export { PasswordService } from './password.service';
export { JwtService } from './jwt.service';
export { TotpService } from './totp.service';
export { AuditLogService, AuditEventType } from './audit-log.service';
export { EmailServiceFactory } from './email.service.factory';
export { ResendEmailService } from './resend-email.service';
export { ConsoleEmailService } from './console-email.service';

// Re-export types from interfaces for convenience
export type { TokenPayload } from '../../application/interfaces/jwt-service.interface';
export type { TotpSetupResult } from '../../application/interfaces/totp-service.interface';

