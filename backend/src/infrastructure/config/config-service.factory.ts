import type { IConfigService } from '../../application/interfaces/index.js';
import { LocalEnvConfigService } from './local-env-config.service.js';
import { OciVaultConfigService } from './oci-vault-config.service.js';

/**
 * Configuration Service Factory
 *
 * Creates the appropriate configuration service based on environment
 * - Development: Local .env files
 * - Production: OCI Vault (environment variables populated from vault at deployment)
 */
export class ConfigServiceFactory {
  private static instance: IConfigService | null = null;

  /**
   * Create and initialize the appropriate configuration service
   */
  static async create(): Promise<IConfigService> {
    if (this.instance) {
      return this.instance;
    }

    // Check NODE_ENV from process.env (not from config service yet)
    const nodeEnv = process.env.NODE_ENV || 'development';

    let configService: IConfigService;

    if (nodeEnv === 'production') {
      configService = new OciVaultConfigService();
    } else {
      console.log('📁 Initializing local .env configuration service...');
      configService = new LocalEnvConfigService();
    }

    // Initialize the service (load configuration)
    await configService.initialize();

    this.instance = configService;
    return configService;
  }

  /**
   * Get the current configuration service instance
   * @throws Error if service not initialized
   */
  static getInstance(): IConfigService {
    if (!this.instance) {
      throw new Error('ConfigService not initialized. Call ConfigServiceFactory.create() first.');
    }
    return this.instance;
  }

  /**
   * Reset the instance (useful for testing)
   */
  static reset(): void {
    this.instance = null;
  }
}
