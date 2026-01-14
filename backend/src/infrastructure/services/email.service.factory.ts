/**
 * Email Service Factory
 * 
 * Creates the appropriate email service implementation based on environment configuration.
 * Follows Clean Architecture - allows easy swapping of implementations.
 */

import { IEmailService } from '../../application/interfaces/email-service.interface';
import { NodemailerEmailService } from './nodemailer-email.service';
import { ConsoleEmailService } from './console-email.service';

export class EmailServiceFactory {
  /**
   * Create email service based on EMAIL_PROVIDER environment variable
   * 
   * Options:
   * - 'nodemailer' - Use Nodemailer with SMTP (production)
   * - 'console' - Log to console (development)
   * - Default: 'console' in development, 'nodemailer' in production
   */
  static create(): IEmailService {
    const provider = process.env.EMAIL_PROVIDER || 
      (process.env.NODE_ENV === 'production' ? 'nodemailer' : 'console');

    switch (provider.toLowerCase()) {
      case 'nodemailer':
        try {
          return new NodemailerEmailService();
        } catch (error) {
          console.error('Failed to initialize Nodemailer email service, falling back to console:', error);
          return new ConsoleEmailService();
        }

      case 'console':
        return new ConsoleEmailService();

      default:
        console.warn(`Unknown EMAIL_PROVIDER: ${provider}, using console`);
        return new ConsoleEmailService();
    }
  }
}
