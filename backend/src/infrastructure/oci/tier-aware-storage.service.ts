/**
 * Tier-Aware Storage Service
 * 
 * Enterprise-grade storage service that supports multiple storage tiers
 * (STANDARD and ARCHIVE) with a single OCI client connection pool for efficiency.
 * 
 * Optimizations:
 * - Single client instance (connection pooling)
 * - Dynamic bucket selection based on tier
 * - Efficient resource usage
 * - Cost-optimized operations
 */

import * as common from 'oci-common';
import * as objectstorage from 'oci-objectstorage';
import { IStorageService } from '../../application/interfaces/storage-service.interface';
import { StorageTier } from '../../domain/entities/file';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Tier-Aware Storage Service Implementation
 * 
 * Uses a single OCI client with dynamic bucket selection for optimal performance
 * and resource utilization. This approach:
 * - Reduces connection overhead (single client pool)
 * - Minimizes memory usage
 * - Optimizes API call efficiency
 * - Maintains security isolation per tier
 */
export class TierAwareStorageService implements IStorageService {
  private client: objectstorage.ObjectStorageClient;
  private namespace: string;
  private standardBucketName: string;
  private archiveBucketName: string;
  private region: common.Region;

  // Cache bucket names for quick lookup (O(1) access)
  private readonly bucketMap: Map<StorageTier, string> = new Map();

  constructor() {
    // Get namespace and buckets from environment variables
    this.namespace = process.env.OCI_OBJECT_STORAGE_NAMESPACE || '';
    this.standardBucketName = process.env.OCI_OBJECT_STORAGE_BUCKET_NAME_STANDARD || 'void-standard';
    this.archiveBucketName = process.env.OCI_OBJECT_STORAGE_BUCKET_NAME_ARCHIVE || 'void-archive';

    if (!this.namespace) {
      throw new Error('OCI_OBJECT_STORAGE_NAMESPACE environment variable is required');
    }

    // Initialize bucket map for O(1) lookups
    this.bucketMap.set(StorageTier.STANDARD, this.standardBucketName);
    this.bucketMap.set(StorageTier.ARCHIVE, this.archiveBucketName);

    // Initialize authentication provider from environment variables
    const envTenancy = process.env.OCI_TENANCY_ID;
    const envUser = process.env.OCI_USER_ID;
    const envFingerprint = process.env.OCI_FINGERPRINT;
    const envPrivateKey = process.env.OCI_PRIVATE_KEY;
    const envPrivateKeyPath = process.env.OCI_PRIVATE_KEY_PATH;
    const envRegion = process.env.OCI_REGION;

    try {
      // Validate required environment variables
      if (!envTenancy || !envUser || !envFingerprint || (!envPrivateKey && !envPrivateKeyPath)) {
        throw new Error(
          `Missing required OCI environment variables. ` +
          `Required: OCI_TENANCY_ID, OCI_USER_ID, OCI_FINGERPRINT, and either OCI_PRIVATE_KEY or OCI_PRIVATE_KEY_PATH`
        );
      }

      const tenancy = envTenancy;
      const user = envUser;
      const fingerprint = envFingerprint;
      const regionId = envRegion || 'us-ashburn-1';
      let privateKeyContent: string;
      let keyFilePath: string | undefined;

      if (envPrivateKey) {
        privateKeyContent = envPrivateKey.trim();
      } else {
        const resolvedKeyPath = path.isAbsolute(envPrivateKeyPath!)
          ? envPrivateKeyPath!
          : path.resolve(process.cwd(), envPrivateKeyPath!);
        
        if (!fs.existsSync(resolvedKeyPath)) {
          throw new Error(`OCI private key file not found at: ${resolvedKeyPath}`);
        }
        
        privateKeyContent = fs.readFileSync(resolvedKeyPath, 'utf8').trim();
        keyFilePath = resolvedKeyPath;
      }

      // Ensure private key ends with newline
      if (!privateKeyContent.endsWith('\n')) {
        privateKeyContent += '\n';
      }

      // Basic key format check
      if (!privateKeyContent.includes('BEGIN') || !privateKeyContent.includes('END')) {
        throw new Error('OCI private key does not appear to be in PEM format');
      }

      this.region = common.Region.fromRegionId(regionId);

      // Create SimpleAuthenticationDetailsProvider with all credentials
      const provider = new common.SimpleAuthenticationDetailsProvider(
        tenancy,
        user,
        fingerprint,
        privateKeyContent,
        process.env.OCI_PRIVATE_KEY_PASSPHRASE || null,
        this.region
      );

      // Create ObjectStorageClient with authentication provider
      // Single client instance for connection pooling efficiency
      this.client = new objectstorage.ObjectStorageClient({
        authenticationDetailsProvider: provider,
      });

      // Set region on client
      if (typeof (this.client as any).setRegion === 'function') {
        (this.client as any).setRegion(this.region.regionId);
      } else {
        (this.client as any).region = this.region;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('❌ OCI initialization error:', errorMessage);
      
      throw new Error(
        `Failed to initialize Tier-Aware OCI Object Storage client.\n\n` +
        `Please ensure the following environment variables are set:\n` +
        `- OCI_TENANCY_ID\n` +
        `- OCI_USER_ID\n` +
        `- OCI_FINGERPRINT\n` +
        `- OCI_PRIVATE_KEY or OCI_PRIVATE_KEY_PATH\n` +
        `- OCI_REGION (optional, defaults to us-ashburn-1)\n` +
        `- OCI_OBJECT_STORAGE_BUCKET_NAME_STANDARD (optional, defaults to void-standard)\n` +
        `- OCI_OBJECT_STORAGE_BUCKET_NAME_ARCHIVE (optional, defaults to void-archive)\n` +
        `- OCI_PRIVATE_KEY_PASSPHRASE (optional, only if key is encrypted)\n\n` +
        `Error: ${errorMessage}`
      );
    }
  }

  /**
   * Get bucket name for a given storage tier
   * Uses O(1) Map lookup for efficiency
   */
  private getBucketName(tier: StorageTier): string {
    const bucketName = this.bucketMap.get(tier);
    if (!bucketName) {
      throw new Error(`Invalid storage tier: ${tier}`);
    }
    return bucketName;
  }

  /**
   * Upload file to the specified tier's bucket
   * 
   * Note: This method requires tier to be passed via metadata or a separate parameter.
   * For tier-aware operations, use the tier-specific methods in the use cases.
   */
  async uploadFile(params: {
    objectName: string;
    file: Buffer | ReadableStream;
    contentType: string;
    metadata?: Record<string, string>;
    tier?: StorageTier; // Optional tier parameter
  }): Promise<{
    objectName: string;
    etag: string;
    size: number;
  }> {
    // Determine tier from metadata or default to STANDARD
    const tier = params.tier || StorageTier.STANDARD;
    const bucketName = this.getBucketName(tier);

    try {
      // Convert ReadableStream to Buffer if needed (optimized for large files)
      let fileBuffer: Buffer;
      if (params.file instanceof Buffer) {
        fileBuffer = params.file;
      } else {
        // Stream processing for memory efficiency
        const stream = params.file as any;
        const chunks: Buffer[] = [];
        const reader = stream.getReader ? stream.getReader() : null;
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
          }
        } else {
          for await (const chunk of stream as any) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
        }
        fileBuffer = Buffer.concat(chunks);
      }

      // Create PutObjectRequest with tier-specific bucket
      const putObjectRequest: objectstorage.requests.PutObjectRequest = {
        namespaceName: this.namespace,
        bucketName,
        putObjectBody: fileBuffer,
        objectName: params.objectName,
        contentLength: fileBuffer.length,
        contentType: params.contentType,
        ...(params.metadata && { opcMeta: params.metadata }),
      };

      // Upload to OCI Object Storage (non-blocking, async)
      const response = await this.client.putObject(putObjectRequest);

      return {
        objectName: params.objectName,
        etag: response.opcRequestId || response.opcContentMd5 || '',
        size: fileBuffer.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload file to ${tier} tier: ${errorMessage}`);
    }
  }

  /**
   * Download file from the specified tier's bucket
   */
  async downloadFile(objectName: string, tier: StorageTier = StorageTier.STANDARD): Promise<{
    file: Buffer;
    contentType: string;
    contentLength: number;
    metadata?: Record<string, string>;
  }> {
    const bucketName = this.getBucketName(tier);

    try {
      const getObjectRequest: objectstorage.requests.GetObjectRequest = {
        namespaceName: this.namespace,
        bucketName,
        objectName,
      };

      const response = await this.client.getObject(getObjectRequest);

      // Stream processing for memory efficiency (important for large archive files)
      const chunks: Buffer[] = [];
      const stream = response.value as any;
      const reader = stream.getReader ? stream.getReader() : null;
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
        }
      } else {
        for await (const chunk of stream as any) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
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
        throw new Error(`File not found in ${tier} tier: ${objectName}`);
      }
      throw new Error(`Failed to download file from ${tier} tier: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file from the specified tier's bucket
   */
  async deleteFile(objectName: string, tier: StorageTier = StorageTier.STANDARD): Promise<void> {
    const bucketName = this.getBucketName(tier);

    try {
      const deleteObjectRequest: objectstorage.requests.DeleteObjectRequest = {
        namespaceName: this.namespace,
        bucketName,
        objectName,
      };

      await this.client.deleteObject(deleteObjectRequest);
    } catch (error) {
      // If file doesn't exist, that's okay for delete operations (idempotent)
      if (error instanceof Error && !error.message.includes('Not Found')) {
        throw new Error(`Failed to delete file from ${tier} tier: ${error.message}`);
      }
    }
  }

  /**
   * Check if file exists in the specified tier's bucket
   */
  async fileExists(objectName: string, tier: StorageTier = StorageTier.STANDARD): Promise<boolean> {
    const bucketName = this.getBucketName(tier);

    try {
      const headObjectRequest: objectstorage.requests.HeadObjectRequest = {
        namespaceName: this.namespace,
        bucketName,
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

  /**
   * Get file metadata from the specified tier's bucket
   */
  async getFileMetadata(objectName: string, tier: StorageTier = StorageTier.STANDARD): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    metadata?: Record<string, string>;
  }> {
    const bucketName = this.getBucketName(tier);

    try {
      const headObjectRequest: objectstorage.requests.HeadObjectRequest = {
        namespaceName: this.namespace,
        bucketName,
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
        throw new Error(`File not found in ${tier} tier: ${objectName}`);
      }
      throw new Error(`Failed to get file metadata from ${tier} tier: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate presigned URL (PAR) for the specified tier's bucket
   */
  async generatePresignedUrl(objectName: string, expiresInSeconds: number = 3600, tier: StorageTier = StorageTier.STANDARD): Promise<string> {
    const result = await this.createPreAuthenticatedRequest({
      objectName,
      expiresInHours: Math.ceil(expiresInSeconds / 3600),
      accessType: 'ObjectRead',
      tier,
    });
    return result.parUrl;
  }

  /**
   * Create Pre-Authenticated Request (PAR) for the specified tier's bucket
   */
  async createPreAuthenticatedRequest(params: {
    objectName: string;
    expiresInHours?: number;
    accessType?: 'ObjectRead' | 'ObjectWrite' | 'ObjectReadWrite';
    tier?: StorageTier;
  }): Promise<{
    parUrl: string;
    parId: string;
  }> {
    const tier = params.tier || StorageTier.STANDARD;
    const bucketName = this.getBucketName(tier);

    try {
      const expiresInHours = params.expiresInHours || 24;
      const expirationTime = new Date();
      expirationTime.setHours(expirationTime.getHours() + expiresInHours);

      const accessType = params.accessType || 'ObjectReadWrite';
      
      // Map access type to OCI enum
      let ociAccessType: objectstorage.models.CreatePreauthenticatedRequestDetails.AccessType;
      switch (accessType) {
        case 'ObjectRead':
          ociAccessType = objectstorage.models.CreatePreauthenticatedRequestDetails.AccessType.ObjectRead;
          break;
        case 'ObjectWrite':
          ociAccessType = objectstorage.models.CreatePreauthenticatedRequestDetails.AccessType.ObjectWrite;
          break;
        case 'ObjectReadWrite':
        default:
          ociAccessType = objectstorage.models.CreatePreauthenticatedRequestDetails.AccessType.ObjectReadWrite;
          break;
      }

      const createParDetails: objectstorage.models.CreatePreauthenticatedRequestDetails = {
        name: `upload-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
        accessType: ociAccessType,
        objectName: params.objectName,
        timeExpires: expirationTime,
      };

      const createParRequest: objectstorage.requests.CreatePreauthenticatedRequestRequest = {
        namespaceName: this.namespace,
        bucketName,
        createPreauthenticatedRequestDetails: createParDetails,
      };

      const response = await this.client.createPreauthenticatedRequest(createParRequest);

      if (!response.preauthenticatedRequest) {
        throw new Error('Failed to create PAR: No response data');
      }

      // Construct full PAR URL
      const regionId = this.region.regionId;
      const parUrl = `https://objectstorage.${regionId}.oraclecloud.com${response.preauthenticatedRequest.accessUri}`;
      const parId = response.preauthenticatedRequest.id;

      return {
        parUrl,
        parId,
      };
    } catch (error) {
      throw new Error(`Failed to create Pre-Authenticated Request for ${tier} tier: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete Pre-Authenticated Request (PAR) from the specified tier's bucket
   */
  async deletePreAuthenticatedRequest(parId: string, tier: StorageTier = StorageTier.STANDARD): Promise<void> {
    const bucketName = this.getBucketName(tier);

    try {
      const deleteParRequest: objectstorage.requests.DeletePreauthenticatedRequestRequest = {
        namespaceName: this.namespace,
        bucketName,
        parId,
      };

      await this.client.deletePreauthenticatedRequest(deleteParRequest);
    } catch (error) {
      // Log but don't throw - PAR might already be deleted or expired
      // PAR deletion failed (may already be deleted or expired)
    }
  }

  /**
   * Copy file within the same tier's bucket
   */
  async copyFile(sourceObjectName: string, destinationObjectName: string, tier: StorageTier = StorageTier.STANDARD): Promise<void> {
    const bucketName = this.getBucketName(tier);

    try {
      const copyObjectRequest: objectstorage.requests.CopyObjectRequest = {
        namespaceName: this.namespace,
        bucketName,
        copyObjectDetails: {
          sourceObjectName,
          destinationRegion: this.region.regionId,
          destinationNamespace: this.namespace,
          destinationBucket: bucketName,
          destinationObjectName,
        },
      };

      await this.client.copyObject(copyObjectRequest);
    } catch (error) {
      throw new Error(`Failed to copy file in ${tier} tier: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get file size from the specified tier's bucket
   */
  async getFileSize(objectName: string, tier: StorageTier = StorageTier.STANDARD): Promise<number> {
    try {
      const metadata = await this.getFileMetadata(objectName, tier);
      return metadata.size;
    } catch (error) {
      throw new Error(`Failed to get file size from ${tier} tier: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
