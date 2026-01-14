/**
 * Environment Variable Validator
 * 
 * Validates critical environment variables and ensures security requirements are met.
 * Throws errors in production if required variables are missing or using defaults.
 */

/**
 * Validates TOTP encryption key
 * @throws Error if key is missing or using default value in production
 */
export function validateTotpEncryptionKey(): string {
  const key = process.env.TOTP_ENCRYPTION_KEY;
  const isProduction = process.env.NODE_ENV === 'production';

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
    throw new Error(
      'TOTP_ENCRYPTION_KEY must be at least 32 characters long for security.'
    );
  }

  return key;
}

/**
 * Gets TOTP encryption key with validation
 */
export function getTotpEncryptionKey(): string {
  return validateTotpEncryptionKey();
}

/**
 * Validates JWT secret
 * @throws Error if secret is missing or using default value in production
 */
export function validateJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!secret) {
    if (isProduction) {
      throw new Error(
        'JWT_SECRET is required in production. Set a secure secret (minimum 32 characters).'
      );
    }
    throw new Error(
      'JWT_SECRET is required. Set a secure secret (minimum 32 characters).'
    );
  }

  if (secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters long for security.'
    );
  }

  return secret;
}

/**
 * Validates database connection
 * @throws Error if database configuration is invalid
 */
export function validateDatabaseConfig(): void {
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasIndividualConfig =
    process.env.DATABASE_HOST &&
    process.env.DATABASE_USER &&
    process.env.DATABASE_PASSWORD &&
    process.env.DATABASE_NAME;

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
export function validateEnvironment(): void {
  validateDatabaseConfig();
  validateJwtSecret();
  validateTotpEncryptionKey();
}
