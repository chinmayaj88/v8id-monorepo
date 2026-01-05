/**
 * Application Interfaces
 * 
 * Interfaces (contracts) that define how the application layer interacts
 * with the infrastructure layer. These are implemented in the infrastructure layer.
 */

export { IUserRepository } from './user-repository.interface';
export {
  IDeviceSessionRepository,
  type DeviceSession,
} from './device-session-repository.interface';
export { ITotpBackupCodeRepository } from './totp-backup-code-repository.interface';
