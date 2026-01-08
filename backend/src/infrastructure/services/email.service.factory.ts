/**
 * Email Service Factory
 * 
 * Creates the appropriate email service implementation based on environment configuration.
 * Follows Clean Architecture - allows easy swapping of implementations.
 */

import { IEmailService } from '../../application/interfaces/email-service.interface';
import { ResendEmailService } from './resend-email.service';
import { ConsoleEmailService } from './console-email.service';

export class EmailServiceFactory {
  /**
   * Create email service based on EMAIL_PROVIDER environment variable
   * 
   * Options:
   * - 'resend' - Use Resend API (production)
   * - 'console' - Log to console (development)
   * - Default: 'console' in development, 'resend' in production
   */
  static create(): IEmailService {
    const provider = process.env.EMAIL_PROVIDER || 
      (process.env.NODE_ENV === 'production' ? 'resend' : 'console');

    console.log(`📧 Email Service: Using provider "${provider}"`);

    switch (provider.toLowerCase()) {
      case 'resend':
        try {
          const service = new ResendEmailService();
          console.log('✅ Resend email service initialized successfully');
          return service;
        } catch (error) {
          console.error('❌ Failed to initialize Resend email service:', error);
          console.warn('⚠️  Falling back to console email service');
          console.warn('💡 To use Resend, set these environment variables:');
          console.warn('   EMAIL_PROVIDER=resend');
          console.warn('   RESEND_API_KEY=re_xxxxxxxxxxxxx');
          return new ConsoleEmailService();
        }

      case 'console':
        console.log('📝 Console email service (emails will be logged to console)');
        return new ConsoleEmailService();

      default:
        console.warn(`⚠️  Unknown EMAIL_PROVIDER: ${provider}, using console`);
        return new ConsoleEmailService();
    }
  }
}
