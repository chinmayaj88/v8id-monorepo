/**
 * Environment Variable Validator
 *
 * Validates critical environment variables from IConfigService.
 * Ensures security requirements are met.
 * Throws errors in production if required variables are missing or using defaults.
 */

import type { IConfigService } from '../../application/interfaces/index.js';

/**
 * Validates TOTP encryption key
 * @throws Error if key is missing or using default value in production
 */
export function validateTotpEncryptionKey(configService: IConfigService): string {
  const key = configService.get('TOTP_ENCRYPTION_KEY');
  const isProduction = configService.isProduction();

  if (!key) {
    if (isProduction) {
      throw new Error(
        'TOTP_ENCRYPTION_KEY is required in production. Set a secure encryption key (minimum 32 characters).'
      );
    }
    console.warn(
      '⚠️  WARNING: TOTP_ENCRYPTION_KEY not set. Using default key. This is INSECURE and should only be used in development.'
    );
    return 'default-key-change-in-production';
  }

  if (key === 'default-key-change-in-production') {
    if (isProduction) {
      throw new Error(
        'TOTP_ENCRYPTION_KEY cannot be the default value in production. Set a secure encryption key (minimum 32 characters).'
      );
    }
    console.warn(
      '⚠️  WARNING: Using default TOTP encryption key. Change TOTP_ENCRYPTION_KEY in production!'
    );
  }

  if (key.length < 32) {
    throw new Error('TOTP_ENCRYPTION_KEY must be at least 32 characters long for security.');
  }

  return key;
}

/**
 * Validates JWT secret
 * @throws Error if secret is missing or using default value in production
 */
export function validateJwtSecret(configService: IConfigService): string {
  const secret = configService.get('JWT_SECRET');
  const isProduction = configService.isProduction();

  if (!secret) {
    if (isProduction) {
      throw new Error(
        'JWT_SECRET is required in production. Set a secure secret (minimum 32 characters).'
      );
    }
    throw new Error('JWT_SECRET is required. Set a secure secret (minimum 32 characters).');
  }

  if (secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long for security.');
  }

  return secret;
}

/**
 * Validates database connection
 * @throws Error if database configuration is invalid
 */
export function validateDatabaseConfig(configService: IConfigService): void {
  const hasDatabaseUrl = configService.has('DATABASE_URL');
  const hasIndividualConfig =
    configService.has('DATABASE_HOST') &&
    configService.has('DATABASE_USER') &&
    configService.has('DATABASE_PASSWORD') &&
    configService.has('DATABASE_NAME');

  if (!hasDatabaseUrl && !hasIndividualConfig) {
    throw new Error(
      'Database configuration is required. Set DATABASE_URL or individual DATABASE_* variables.'
    );
  }
}

/**
 * Validates all critical environment variables
 * Call this at application startup
 * @throws Error if any critical variable is invalid
 */
export function validateEnvironment(configService: IConfigService): void {
  validateDatabaseConfig(configService);
  validateJwtSecret(configService);
  validateTotpEncryptionKey(configService);
}


