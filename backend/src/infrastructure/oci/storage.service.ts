/**
 * OCI Object Storage Service Implementation
 * 
 * Concrete implementation of IStorageService using OCI Object Storage SDK.
 */

import * as common from 'oci-common';
import * as objectstorage from 'oci-objectstorage';
import { IStorageService } from '../../application/interfaces/storage-service.interface';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export class OciStorageService implements IStorageService {
  private client: objectstorage.ObjectStorageClient;
  private namespace: string;
  private bucketName: string;
  private region: common.Region;

  constructor() {
    // Initialize OCI authentication provider
    // Try environment variables first, then fall back to config file
    const { provider, region } = this.createAuthenticationProvider();
    
    this.region = region;
    this.client = new objectstorage.ObjectStorageClient({
      authenticationDetailsProvider: provider,
    });

    // Get namespace and bucket from environment
    this.namespace = process.env.OCI_OBJECT_STORAGE_NAMESPACE || '';
    this.bucketName = process.env.OCI_OBJECT_STORAGE_BUCKET_NAME || 'v8id-files';

    if (!this.namespace) {
      console.warn('OCI_OBJECT_STORAGE_NAMESPACE not set. OCI operations will fail.');
    }
  }

  /**
   * Create OCI authentication provider from environment variables or config file
   * 
   * Priority order (best practices):
   * 1. Environment variables (OCI_TENANCY_ID, OCI_USER_ID, etc.) - BEST for production/containers
   * 2. Explicit config file path (OCI_CONFIG_FILE env var)
   * 3. Default config file location (~/.oci/config) - works on both Windows and Linux
   * 
   * Cross-platform path handling:
   * - Windows: C:\Users\<username>\.oci\config
   * - Linux: /home/<username>/.oci/config
   * - Uses os.homedir() for automatic detection
   */
  private createAuthenticationProvider(): { provider: common.AuthenticationDetailsProvider; region: common.Region } {
    // Priority 1: Check if we have all required environment variables for direct authentication
    // BEST PRACTICE: Use environment variables in production (Docker, Kubernetes, CI/CD)
    const tenancyId = process.env.OCI_TENANCY_ID || process.env.OCI_CLI_TENANCY;
    const userId = process.env.OCI_USER_ID || process.env.OCI_CLI_USER;
    const fingerprint = process.env.OCI_FINGERPRINT || process.env.OCI_CLI_FINGERPRINT;
    const privateKey = process.env.OCI_PRIVATE_KEY || process.env.OCI_CLI_KEY_CONTENT;
    const privateKeyPath = process.env.OCI_PRIVATE_KEY_PATH || process.env.OCI_CLI_KEY_FILE;
    const passphrase = process.env.OCI_PRIVATE_KEY_PASSPHRASE;
    const regionStr = process.env.OCI_REGION || process.env.OCI_CLI_REGION || 'us-ashburn-1';
    const region = common.Region.fromRegionId(regionStr);

    // If all required env vars are present, use SimpleAuthenticationDetailsProvider
    // This is the recommended approach for production deployments
    if (tenancyId && userId && fingerprint && (privateKey || privateKeyPath)) {
      try {
        let privateKeyContent = privateKey;
        
        // If private key path is provided, read from file (supports both absolute and relative paths)
        if (privateKeyPath && !privateKey) {
          // Resolve path (handles both absolute and relative paths cross-platform)
          const resolvedKeyPath = path.isAbsolute(privateKeyPath) 
            ? privateKeyPath 
            : path.resolve(process.cwd(), privateKeyPath);
          
          if (!fs.existsSync(resolvedKeyPath)) {
            throw new Error(`OCI private key file not found at: ${resolvedKeyPath}`);
          }
          
          privateKeyContent = fs.readFileSync(resolvedKeyPath, 'utf8');
        }
        
        const provider = new common.SimpleAuthenticationDetailsProvider(
          tenancyId,
          userId,
          fingerprint,
          privateKeyContent!,
          passphrase || null,
          region
        );
        
        console.log('✅ OCI authentication initialized from environment variables');
        return { provider, region };
      } catch (error) {
        console.error('Failed to create OCI authentication from environment variables:', error);
        throw new Error(`OCI authentication configuration error. Check your environment variables: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Priority 2 & 3: Fall back to config file authentication
    // Supports both explicit path and default location (cross-platform)
    try {
      const configFile = process.env.OCI_CONFIG_FILE;
      const configProfile = process.env.OCI_CONFIG_PROFILE || 'DEFAULT';
      
      let provider: common.AuthenticationDetailsProvider;
      let actualConfigFile: string | undefined = configFile;
      
      // Priority 2: Use explicit config file path if provided via environment variable
      // This allows overriding the default location for production deployments
      if (actualConfigFile) {
        // Resolve path (handles both absolute and relative paths)
        actualConfigFile = path.isAbsolute(actualConfigFile) 
          ? actualConfigFile 
          : path.resolve(process.cwd(), actualConfigFile);
        
        if (!fs.existsSync(actualConfigFile)) {
          throw new Error(`OCI config file not found at: ${actualConfigFile}`);
        }
        console.log(`📁 Using OCI config file from OCI_CONFIG_FILE env var: ${actualConfigFile}`);
      } else {
        // Priority 3: Try default location (cross-platform: ~/.oci/config)
        // os.homedir() automatically detects the correct path on Windows and Linux
        const defaultConfigPath = path.join(os.homedir(), '.oci', 'config');
        if (fs.existsSync(defaultConfigPath)) {
          actualConfigFile = defaultConfigPath;
          console.log(`📁 Found OCI config file at default location: ${actualConfigFile}`);
        }
      }
      
      if (actualConfigFile) {
        // Verify the file exists and is readable
        if (!fs.existsSync(actualConfigFile)) {
          throw new Error(`OCI config file not found at: ${actualConfigFile}`);
        }
        
        // Try to parse the config file manually first (handles files without [DEFAULT] section)
        try {
          const configContent = fs.readFileSync(actualConfigFile, 'utf8');
          const configValues = this.parseConfigFile(configContent, configProfile);
          
          // If we successfully parsed config values, use SimpleAuthenticationDetailsProvider
          if (configValues.user && configValues.fingerprint && configValues.tenancy && configValues.keyFile) {
            // Resolve key_file path (can be absolute or relative to config file directory)
            const keyFilePath = path.isAbsolute(configValues.keyFile)
              ? configValues.keyFile
              : path.join(path.dirname(actualConfigFile), configValues.keyFile);
            
            if (!fs.existsSync(keyFilePath)) {
              throw new Error(`OCI private key file not found at: ${keyFilePath} (specified in config file)`);
            }
            
            const privateKeyContent = fs.readFileSync(keyFilePath, 'utf8');
            const configRegion = configValues.region 
              ? common.Region.fromRegionId(configValues.region)
              : region;
            
            provider = new common.SimpleAuthenticationDetailsProvider(
              configValues.tenancy,
              configValues.user,
              configValues.fingerprint,
              privateKeyContent,
              configValues.passphrase || null,
              configRegion
            );
            
            console.log(`✅ OCI authentication initialized from config file (region: ${configRegion.regionId})`);
            return { provider, region: configRegion };
          }
        } catch (parseError) {
          // If manual parsing fails, fall through to SDK's ConfigFileAuthenticationDetailsProvider
          console.log(`⚠️  Manual config parsing failed, trying SDK provider: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        }
        
        // Use SDK's ConfigFileAuthenticationDetailsProvider (requires [DEFAULT] profile section)
        try {
          provider = new common.ConfigFileAuthenticationDetailsProvider(actualConfigFile, configProfile);
          console.log(`✅ OCI authentication initialized using SDK config provider (profile: ${configProfile})`);
        } catch (sdkError) {
          throw new Error(
            `Failed to parse OCI config file at ${actualConfigFile}. ` +
            `Please ensure the file has a [${configProfile}] profile section with user, fingerprint, tenancy, region, and key_file fields. ` +
            `Error: ${sdkError instanceof Error ? sdkError.message : 'Unknown error'}`
          );
        }
      } else {
        // Let the SDK try to find it in the default location
        try {
          provider = new common.ConfigFileAuthenticationDetailsProvider(undefined, configProfile);
          console.log(`✅ OCI authentication initialized using SDK default config provider (profile: ${configProfile})`);
        } catch (sdkError) {
          const defaultConfigPath = path.join(os.homedir(), '.oci', 'config');
          throw new Error(
            `Failed to initialize OCI authentication. Config file not found at default location ${defaultConfigPath}. ` +
            `Please set OCI_CONFIG_FILE environment variable or ensure config file exists. ` +
            `Error: ${sdkError instanceof Error ? sdkError.message : 'Unknown error'}`
          );
        }
      }
      
      return { provider, region };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const defaultConfigPath = path.join(os.homedir(), '.oci', 'config');
      
      // Provide helpful error message with all configuration options
      throw new Error(
        `Failed to initialize OCI authentication. ` +
        `\n\nConfiguration options (in priority order):` +
        `\n1. Environment variables (recommended for production):` +
        `\n   - OCI_TENANCY_ID, OCI_USER_ID, OCI_FINGERPRINT, OCI_PRIVATE_KEY (or OCI_PRIVATE_KEY_PATH)` +
        `\n2. Explicit config file path:` +
        `\n   - Set OCI_CONFIG_FILE environment variable to config file path` +
        `\n3. Default config file location:` +
        `\n   - ${defaultConfigPath} (cross-platform: works on Windows and Linux)` +
        `\n\nOriginal error: ${errorMessage}`
      );
    }
  }

  /**
   * Parse OCI config file content and extract values for a specific profile
   * Handles both formats: with [DEFAULT] profile section and without (for backwards compatibility)
   * 
   * Supported config file formats:
   * Format 1 (Standard - with profile section):
   *   [DEFAULT]
   *   user=ocid1.user.oc1..xxx
   *   fingerprint=xx:xx:xx:...
   *   tenancy=ocid1.tenancy.oc1..xxx
   *   region=us-ashburn-1
   *   key_file=/path/to/private_key.pem
   * 
   * Format 2 (Legacy - without profile section):
   *   user=ocid1.user.oc1..xxx
   *   fingerprint=xx:xx:xx:...
   *   tenancy=ocid1.tenancy.oc1..xxx
   *   region=us-ashburn-1
   *   key_file=/path/to/private_key.pem
   */
  private parseConfigFile(configContent: string, profile: string): {
    user?: string;
    fingerprint?: string;
    tenancy?: string;
    region?: string;
    keyFile?: string;
    passphrase?: string;
  } {
    const lines = configContent.split('\n');
    const result: {
      user?: string;
      fingerprint?: string;
      tenancy?: string;
      region?: string;
      keyFile?: string;
      passphrase?: string;
    } = {};
    
    let inTargetProfile = profile === 'DEFAULT';
    let currentProfile = '';
    let hasProfileSection = false;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      
      // Check for profile sections [PROFILE_NAME]
      const profileMatch = trimmedLine.match(/^\[(.+)\]$/);
      if (profileMatch) {
        const matchedProfile = profileMatch[1];
        if (matchedProfile) {
          hasProfileSection = true;
          currentProfile = matchedProfile;
          inTargetProfile = currentProfile === profile || (profile === 'DEFAULT' && currentProfile === 'DEFAULT');
          continue;
        }
      }
      
      // Only parse key-value pairs if we're in the target profile
      // If no profile section exists, parse all lines (backwards compatibility)
      if (inTargetProfile || (!hasProfileSection && profile === 'DEFAULT')) {
        const keyValueMatch = trimmedLine.match(/^([^=]+)=(.*)$/);
        if (keyValueMatch) {
          const keyPart = keyValueMatch[1];
          const valuePart = keyValueMatch[2];
          if (keyPart && valuePart !== undefined) {
            const key = keyPart.trim().toLowerCase();
            const value = valuePart.trim();
            
            switch (key) {
              case 'user':
                result.user = value;
                break;
              case 'fingerprint':
                result.fingerprint = value;
                break;
              case 'tenancy':
                result.tenancy = value;
                break;
              case 'region':
                result.region = value;
                break;
              case 'key_file':
                result.keyFile = value;
                break;
              case 'pass_phrase':
              case 'passphrase':
                result.passphrase = value;
                break;
            }
          }
        }
      }
    }
    
    return result;
  }

  async uploadFile(params: {
    objectName: string;
    file: Buffer | ReadableStream;
    contentType: string;
    metadata?: Record<string, string>;
  }): Promise<{
    objectName: string;
    etag: string;
    size: number;
  }> {
    try {
      // Convert ReadableStream to Buffer if needed
      let fileBuffer: Buffer;
      if (params.file instanceof Buffer) {
        fileBuffer = params.file;
      } else {
        // Convert stream to buffer
        const chunks: Buffer[] = [];
        for await (const chunk of params.file) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        fileBuffer = Buffer.concat(chunks);
      }

      const putObjectRequest: objectstorage.requests.PutObjectRequest = {
        namespaceName: this.namespace,
        bucketName: this.bucketName,
        putObjectBody: fileBuffer,
        objectName: params.objectName,
        contentLength: fileBuffer.length,
        contentType: params.contentType,
        ...(params.metadata && { opcMeta: params.metadata }),
      };

      const response = await this.client.putObject(putObjectRequest);

      return {
        objectName: params.objectName,
        etag: response.opcRequestId || '',
        size: fileBuffer.length,
      };
    } catch (error) {
      throw new Error(`Failed to upload file to OCI Object Storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadFile(objectName: string): Promise<{
    file: Buffer;
    contentType: string;
    contentLength: number;
    metadata?: Record<string, string>;
  }> {
    try {
      const getObjectRequest: objectstorage.requests.GetObjectRequest = {
        namespaceName: this.namespace,
        bucketName: this.bucketName,
        objectName,
      };

      const response = await this.client.getObject(getObjectRequest);

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of response.value) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const fileBuffer = Buffer.concat(chunks);

      const contentType = response.contentType || 'application/octet-stream';
      const contentLength = Number(response.contentLength || fileBuffer.length);
      const metadata = response.opcMeta || undefined;

      return {
        file: fileBuffer,
        contentType,
        contentLength,
        metadata,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Not Found')) {
        throw new Error(`File not found: ${objectName}`);
      }
      throw new Error(`Failed to download file from OCI Object Storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteFile(objectName: string): Promise<void> {
    try {
      const deleteObjectRequest: objectstorage.requests.DeleteObjectRequest = {
        namespaceName: this.namespace,
        bucketName: this.bucketName,
        objectName,
      };

      await this.client.deleteObject(deleteObjectRequest);
    } catch (error) {
      // If file doesn't exist, that's okay for delete operations
      if (error instanceof Error && !error.message.includes('Not Found')) {
        throw new Error(`Failed to delete file from OCI Object Storage: ${error.message}`);
      }
    }
  }

  async fileExists(objectName: string): Promise<boolean> {
    try {
      const headObjectRequest: objectstorage.requests.HeadObjectRequest = {
        namespaceName: this.namespace,
        bucketName: this.bucketName,
        objectName,
      };

      await this.client.headObject(headObjectRequest);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Not Found')) {
        return false;
      }
      // For other errors, assume file doesn't exist
      return false;
    }
  }

  async getFileMetadata(objectName: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    metadata?: Record<string, string>;
  }> {
    try {
      const headObjectRequest: objectstorage.requests.HeadObjectRequest = {
        namespaceName: this.namespace,
        bucketName: this.bucketName,
        objectName,
      };

      const response = await this.client.headObject(headObjectRequest);

      return {
        size: Number(response.contentLength || 0),
        contentType: response.contentType || 'application/octet-stream',
        lastModified: response.lastModified || new Date(),
        metadata: response.opcMeta || undefined,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('Not Found')) {
        throw new Error(`File not found: ${objectName}`);
      }
      throw new Error(`Failed to get file metadata from OCI Object Storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generatePresignedUrl(_objectName: string, _expiresInSeconds: number = 3600): Promise<string> {
    try {
      // OCI uses pre-authenticated requests instead of presigned URLs
      // This would require creating a PAR (Pre-Authenticated Request) first
      // For now, return a placeholder - this needs proper implementation with PAR API
      throw new Error('Pre-signed URL generation not yet implemented. Use Pre-Authenticated Requests (PAR) instead.');
    } catch (error) {
      throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async copyFile(sourceObjectName: string, destinationObjectName: string): Promise<void> {
    try {
      const copyObjectRequest: objectstorage.requests.CopyObjectRequest = {
        namespaceName: this.namespace,
        bucketName: this.bucketName,
        copyObjectDetails: {
          sourceObjectName,
          destinationRegion: this.region.regionId,
          destinationNamespace: this.namespace,
          destinationBucket: this.bucketName,
          destinationObjectName,
        },
      };

      await this.client.copyObject(copyObjectRequest);
    } catch (error) {
      throw new Error(`Failed to copy file in OCI Object Storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getFileSize(objectName: string): Promise<number> {
    try {
      const metadata = await this.getFileMetadata(objectName);
      return metadata.size;
    } catch (error) {
      throw new Error(`Failed to get file size: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
