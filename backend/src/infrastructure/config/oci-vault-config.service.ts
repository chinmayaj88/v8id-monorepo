import * as common from 'oci-common';
import * as vault from 'oci-vault';
import * as secrets from 'oci-secrets';
import type { IConfigService } from '../../application/interfaces/config-service.interface.js';

/**
 * OCI Vault Configuration Service
 *
 * Dynamically loads configuration from OCI Vault at runtime.
 * Supports:
 * - Instance Principals (Production / OCI Compute)
 * - Simple Auth / API Keys (Development)
 * - Fallback to pre-populated Environment Variables
 *
 * Follows Clean Architecture by abstracting the configuration source.
 */
export class OciVaultConfigService implements IConfigService {
  private config: Record<string, string> = {};
  private initialized = false;
  private readonly SECRET_PREFIX = 'v8id-cloud-';

  constructor() {}

  /**
   * Initialize the service by loading secrets from OCI Vault
   * Falls back to process.env if Vault access fails or variables are already set.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log('🔐 Initializing OCI Vault configuration service...');

    // 1. Initial load from process.env (for variables injected by shell script or Docker)
    this.config = { ...process.env } as Record<string, string>;

    const compartmentId = process.env.OCI_COMPARTMENT_ID;
    const vaultId = process.env.OCI_VAULT_ID;

    // 2. If we have Vault details, try to fetch missing secrets dynamically
    if (compartmentId && vaultId) {
      try {
        await this.loadSecretsFromVault(compartmentId, vaultId);
      } catch (error) {
        console.warn(
          '⚠️  Could not fetch secrets from OCI Vault SDK, proceeding with environment variables:',
          error instanceof Error ? error.message : String(error)
        );
      }
    } else {
      console.log(
        'ℹ️  Vault setup (OCI_VAULT_ID) not found, using pre-populated environment variables.'
      );
    }

    // 3. Final validation
    const nodeEnv = this.getEnvironment();
    if (nodeEnv !== 'production') {
      console.warn(
        '⚠️  Warning: OciVaultConfigService is being used in non-production environment'
      );
    }

    console.log('✅ OCI Vault configuration service initialized');
    this.initialized = true;
  }

  private async loadSecretsFromVault(compartmentId: string, vaultId: string): Promise<void> {
    const provider = await this.getAuthenticationProvider();
    const vaultClient = new vault.VaultsClient({ authenticationDetailsProvider: provider });
    const secretsClient = new secrets.SecretsClient({ authenticationDetailsProvider: provider });

    // List all secrets in the vault
    const listSecretsRequest: vault.requests.ListSecretsRequest = {
      compartmentId,
      vaultId,
      lifecycleState: vault.models.Secret.LifecycleState.Active,
    };

    const response = await vaultClient.listSecrets(listSecretsRequest);
    const secretsList = response.items || [];

    console.log(`📦 Found ${secretsList.length} secrets in Vault. Checking for updates...`);

    // Process each secret concurrently
    await Promise.all(
      secretsList.map(async secretItem => {
        if (!secretItem.secretName.startsWith(this.SECRET_PREFIX)) {
          return;
        }

        const envVarName = secretItem.secretName.substring(this.SECRET_PREFIX.length);

        // Fetch secret content only if not already set or we want to overwrite
        // In Prod, we might want to prioritize Vault over local env
        try {
          const bundleRequest: secrets.requests.GetSecretBundleRequest = {
            secretId: secretItem.id,
          };
          const bundleResponse = await secretsClient.getSecretBundle(bundleRequest);
          const bundle = bundleResponse.secretBundle
            .secretBundleContent as secrets.models.Base64SecretBundleContentDetails;

          if (bundle && bundle.content) {
            const secretValue = Buffer.from(bundle.content, 'base64').toString('utf8');
            this.config[envVarName] = secretValue;
            // Also update process.env for other services that might still use it
            process.env[envVarName] = secretValue;
          }
        } catch (err) {
          console.error(`❌ Failed to retrieve secret bundle for ${secretItem.secretName}:`, err);
        }
      })
    );
  }

  private async getAuthenticationProvider(): Promise<common.AuthenticationDetailsProvider> {
    const envTenancy = process.env.OCI_TENANCY_ID;
    const envUser = process.env.OCI_USER_ID;
    const envFingerprint = process.env.OCI_FINGERPRINT;
    const envPrivateKey = process.env.OCI_PRIVATE_KEY;
    const envPrivateKeyPath = process.env.OCI_PRIVATE_KEY_PATH;

    if (envTenancy && envUser && envFingerprint && (envPrivateKey || envPrivateKeyPath)) {
      // Use Simple Auth (API Key)
      let privateKeyContent: string;
      if (envPrivateKey) {
        privateKeyContent = envPrivateKey;
      } else {
        const fs = await import('fs');
        privateKeyContent = fs.readFileSync(envPrivateKeyPath!, 'utf8');
      }

      return new common.SimpleAuthenticationDetailsProvider(
        envTenancy,
        envUser,
        envFingerprint,
        privateKeyContent,
        process.env.OCI_PRIVATE_KEY_PASSPHRASE || null,
        common.Region.fromRegionId(process.env.OCI_REGION || 'us-ashburn-1')
      );
    } else {
      // Use Instance Principals
      return await new common.InstancePrincipalsAuthenticationDetailsProviderBuilder().build();
    }
  }

  get(key: string, defaultValue?: string): string | undefined {
    this.ensureInitialized();
    return this.config[key] ?? defaultValue;
  }

  getRequired(key: string): string {
    this.ensureInitialized();
    const value = this.config[key];

    if (!value) {
      throw new Error(
        `Required configuration key "${key}" is not set. ` +
          `Check OCI Vault (name: ${this.SECRET_PREFIX}${key}) or environment variables.`
      );
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
    // If initialized, use internal config, otherwise use process.env as fallback
    const env = this.initialized ? this.config.NODE_ENV : process.env.NODE_ENV;
    return env || 'production';
  }

  isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  isDevelopment(): boolean {
    return this.getEnvironment() === 'development';
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('OciVaultConfigService not initialized. Call initialize() first.');
    }
  }
}
