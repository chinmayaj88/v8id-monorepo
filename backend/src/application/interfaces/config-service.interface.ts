/**
 * Configuration Service Interface
 *
 * Defines the contract for retrieving application configuration.
 * Implementations can read from different sources (local .env, OCI Vault, etc.)
 */

export interface IConfigService {
  /**
   * Initialize the configuration service
   * Load all required configuration from the source
   * @throws Error if configuration cannot be loaded
   */
  initialize(): Promise<void>;

  /**
   * Get a configuration value by key
   * @param key - Configuration key
   * @param defaultValue - Optional default value if key is not found
   * @returns Configuration value or undefined
   */
  get(key: string, defaultValue?: string): string | undefined;

  /**
   * Get a required configuration value by key
   * @param key - Configuration key
   * @throws Error if key is not found
   */
  getRequired(key: string): string;

  /**
   * Get all configuration as a key-value map
   * @returns All configuration values
   */
  getAll(): Record<string, string>;

  /**
   * Check if a configuration key exists
   * @param key - Configuration key
   * @returns true if key exists
   */
  has(key: string): boolean;

  /**
   * Get the environment (development, production, etc.)
   */
  getEnvironment(): string;

  /**
   * Check if running in production
   */
  isProduction(): boolean;

  /**
   * Check if running in development
   */
  isDevelopment(): boolean;
}
