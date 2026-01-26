import { config } from 'dotenv';
import type { IConfigService } from '../../application/interfaces/config-service.interface.js';

/**
 * Local Environment Configuration Service
 *
 * Reads configuration from .env files (for development)
 */
export class LocalEnvConfigService implements IConfigService {
  private config: Record<string, string> = {};
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Load .env file
    const result = config();

    if (result.error) {
      console.warn('⚠️  No .env file found, using process.env only');
    } else {
      console.log('✅ Loaded configuration from .env file');
    }

    // Copy all environment variables to internal config
    this.config = { ...process.env } as Record<string, string>;
    this.initialized = true;
  }

  get(key: string, defaultValue?: string): string | undefined {
    this.ensureInitialized();
    return this.config[key] ?? defaultValue;
  }

  getRequired(key: string): string {
    this.ensureInitialized();
    const value = this.config[key];

    if (!value) {
      throw new Error(`Required configuration key "${key}" is not set`);
    }

    return value;
  }

  getAll(): Record<string, string> {
    this.ensureInitialized();
    return { ...this.config };
  }

  has(key: string): boolean {
    this.ensureInitialized();
    return key in this.config && this.config[key] !== undefined;
  }

  getEnvironment(): string {
    return this.get('NODE_ENV', 'development') ?? 'development';
  }

  isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  isDevelopment(): boolean {
    return this.getEnvironment() === 'development';
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('ConfigService not initialized. Call initialize() first.');
    }
  }
}
