/**
 * OCI Object Storage Service Implementation
 * 
 * Concrete implementation of IStorageService using OCI Object Storage SDK.
 * Reads credentials from environment variables only.
 */

import * as common from 'oci-common';
import * as objectstorage from 'oci-objectstorage';
import { IStorageService } from '../../application/interfaces/storage-service.interface';
import * as path from 'path';
import * as fs from 'fs';

export class OciStorageService implements IStorageService {
  private client: objectstorage.ObjectStorageClient;
  private namespace: string;
  private bucketName: string;
  private region: common.Region;

  constructor() {
    // Get namespace and bucket from environment variables
    this.namespace = process.env.OCI_OBJECT_STORAGE_NAMESPACE || '';
    this.bucketName = process.env.OCI_OBJECT_STORAGE_BUCKET_NAME || 'v8id-files';

    if (!this.namespace) {
      throw new Error('OCI_OBJECT_STORAGE_NAMESPACE environment variable is required');
    }

    // Initialize authentication provider from environment variables only
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
        console.log('🔐 Using OCI credentials from environment variables (inline key)');
      } else {
        const resolvedKeyPath = path.isAbsolute(envPrivateKeyPath!)
          ? envPrivateKeyPath!
          : path.resolve(process.cwd(), envPrivateKeyPath!);
        
        if (!fs.existsSync(resolvedKeyPath)) {
          throw new Error(`OCI private key file not found at: ${resolvedKeyPath}`);
        }
        
        privateKeyContent = fs.readFileSync(resolvedKeyPath, 'utf8').trim();
        keyFilePath = resolvedKeyPath;
        console.log(`🔐 Using OCI credentials from environment variables (key file: ${resolvedKeyPath})`);
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
      this.client = new objectstorage.ObjectStorageClient({
        authenticationDetailsProvider: provider,
      });

      // Set region on client using official setter when available
      if (typeof (this.client as any).setRegion === 'function') {
        (this.client as any).setRegion(this.region.regionId);
      } else {
        // Fallback for older SDKs
        (this.client as any).region = this.region;
      }

      console.log(`✅ OCI Object Storage client initialized successfully`);
      console.log(`   Namespace: ${this.namespace}`);
      console.log(`   Bucket: ${this.bucketName}`);
      console.log(`   Region: ${this.region.regionId}`);
      console.log(`   Key file: ${keyFilePath ?? 'inline key from env'}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('❌ OCI initialization error:', errorMessage);
      
      throw new Error(
        `Failed to initialize OCI Object Storage client.\n\n` +
        `Please ensure the following environment variables are set:\n` +
        `- OCI_TENANCY_ID\n` +
        `- OCI_USER_ID\n` +
        `- OCI_FINGERPRINT\n` +
        `- OCI_PRIVATE_KEY or OCI_PRIVATE_KEY_PATH\n` +
        `- OCI_REGION (optional, defaults to us-ashburn-1)\n` +
        `- OCI_PRIVATE_KEY_PASSPHRASE (optional, only if key is encrypted)\n\n` +
        `Also ensure:\n` +
        `- The private key file exists and is readable (if using OCI_PRIVATE_KEY_PATH)\n` +
        `- The public key has been uploaded to OCI console for this user\n` +
        `- Your system time is synchronized\n\n` +
        `Error: ${errorMessage}`
      );
    }
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
        // Convert ReadableStream to buffer
        const stream = params.file as any;
        const chunks: Buffer[] = [];
        const reader = stream.getReader ? stream.getReader() : null;
        
        if (reader) {
          // Handle ReadableStream with getReader()
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
          }
        } else {
          // Handle Node.js Readable stream
          for await (const chunk of stream as NodeJS.ReadableStream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
        }
        fileBuffer = Buffer.concat(chunks);
      }

      // Create PutObjectRequest
      const putObjectRequest: objectstorage.requests.PutObjectRequest = {
        namespaceName: this.namespace,
        bucketName: this.bucketName,
        putObjectBody: fileBuffer,
        objectName: params.objectName,
        contentLength: fileBuffer.length,
        contentType: params.contentType,
        ...(params.metadata && { opcMeta: params.metadata }),
      };

      // Upload to OCI Object Storage
      const response = await this.client.putObject(putObjectRequest);

      return {
        objectName: params.objectName,
        etag: response.opcRequestId || response.opcContentMd5 || '',
        size: fileBuffer.length,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to upload file to OCI Object Storage: ${errorMessage}`);
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
      const stream = response.value as any;
      const reader = stream.getReader ? stream.getReader() : null;
      
      if (reader) {
        // Handle ReadableStream with getReader()
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(Buffer.isBuffer(value) ? value : Buffer.from(value));
        }
      } else {
        // Handle Node.js Readable stream
        for await (const chunk of stream as NodeJS.ReadableStream) {
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
    // OCI uses Pre-Authenticated Requests (PAR) instead of presigned URLs
    // This would require creating a PAR first via the API
    // For now, throw an error indicating this needs implementation
    throw new Error('Pre-signed URL generation not yet implemented. Use Pre-Authenticated Requests (PAR) instead.');
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
