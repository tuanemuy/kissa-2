// AWS SDK imports commented out until dependencies are installed
// import {
//   DeleteObjectCommand,
//   DeleteObjectsCommand,
//   HeadObjectCommand,
//   PutObjectCommand,
//   S3Client,
// } from "@aws-sdk/client-s3";
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Temporary type definitions for development
// biome-ignore lint/suspicious/noExplicitAny: Temporary mock types until AWS SDK is installed
type S3Client = any;
// biome-ignore lint/suspicious/noExplicitAny: Temporary mock types until AWS SDK is installed
// biome-ignore lint/correctness/noUnusedVariables: Temporary unused types until AWS SDK is installed
type DeleteObjectCommand = any;
// biome-ignore lint/suspicious/noExplicitAny: Temporary mock types until AWS SDK is installed
// biome-ignore lint/correctness/noUnusedVariables: Temporary unused types until AWS SDK is installed
type DeleteObjectsCommand = any;
// biome-ignore lint/suspicious/noExplicitAny: Temporary mock types until AWS SDK is installed
// biome-ignore lint/correctness/noUnusedVariables: Temporary unused types until AWS SDK is installed
type HeadObjectCommand = any;
// biome-ignore lint/suspicious/noExplicitAny: Temporary mock types until AWS SDK is installed
// biome-ignore lint/correctness/noUnusedVariables: Temporary unused types until AWS SDK is installed
type PutObjectCommand = any;
// biome-ignore lint/suspicious/noExplicitAny: Temporary mock function until AWS SDK is installed
// biome-ignore lint/correctness/noUnusedVariables: Temporary unused function until AWS SDK is installed
// biome-ignore lint/correctness/noUnusedFunctionParameters: Temporary mock function until AWS SDK is installed
const _getSignedUrl = (..._args: any[]): Promise<string> =>
  Promise.resolve("mock-signed-url");

import { err, type Result } from "neverthrow";
import type {
  StorageService,
  UploadedFile,
  UploadFileParams,
} from "@/core/domain/region/ports/storageService";
import { StorageServiceError } from "@/core/domain/region/ports/storageService";

export interface S3StorageServiceConfig {
  bucketName: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  publicUrlBase?: string;
}

export class S3StorageService implements StorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrlBase: string;

  constructor(config: S3StorageServiceConfig) {
    this.bucketName = config.bucketName;
    this.publicUrlBase =
      config.publicUrlBase ||
      `https://${config.bucketName}.s3.${config.region}.amazonaws.com`;

    // Temporary mock client for development
    this.s3Client = {} as S3Client;
    // TODO: Replace with actual S3Client when AWS SDK is installed
    // this.s3Client = new S3Client({
    //   region: config.region,
    //   credentials:
    //     config.accessKeyId && config.secretAccessKey
    //       ? {
    //           accessKeyId: config.accessKeyId,
    //           secretAccessKey: config.secretAccessKey,
    //         }
    //       : undefined,
    //   endpoint: config.endpoint,
    // });
  }

  async uploadFile(
    _params: UploadFileParams,
  ): Promise<Result<UploadedFile, StorageServiceError>> {
    // TODO: Implement actual S3 upload when AWS SDK is installed
    return err(
      new StorageServiceError(
        "S3 service not available - AWS SDK not installed",
      ),
    );
  }

  async uploadMultipleFiles(
    _files: UploadFileParams[],
  ): Promise<Result<UploadedFile[], StorageServiceError>> {
    // TODO: Implement actual S3 upload when AWS SDK is installed
    return err(
      new StorageServiceError(
        "S3 service not available - AWS SDK not installed",
      ),
    );
  }

  async deleteFile(_url: string): Promise<Result<void, StorageServiceError>> {
    // TODO: Implement actual S3 delete when AWS SDK is installed
    return err(
      new StorageServiceError(
        "S3 service not available - AWS SDK not installed",
      ),
    );
  }

  async deleteMultipleFiles(
    _urls: string[],
  ): Promise<Result<void, StorageServiceError>> {
    // TODO: Implement actual S3 delete when AWS SDK is installed
    return err(
      new StorageServiceError(
        "S3 service not available - AWS SDK not installed",
      ),
    );
  }

  async getFileInfo(
    _url: string,
  ): Promise<Result<UploadedFile | null, StorageServiceError>> {
    // TODO: Implement actual S3 file info when AWS SDK is installed
    return err(
      new StorageServiceError(
        "S3 service not available - AWS SDK not installed",
      ),
    );
  }

  async generateUploadUrl(
    _filename: string,
    _mimeType: string,
    _folder?: string,
  ): Promise<
    Result<{ uploadUrl: string; fileUrl: string }, StorageServiceError>
  > {
    // TODO: Implement actual S3 signed URL generation when AWS SDK is installed
    return err(
      new StorageServiceError(
        "S3 service not available - AWS SDK not installed",
      ),
    );
  }

  private extractKeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);

      // Handle S3 URL formats:
      // - https://bucket.s3.region.amazonaws.com/key
      // - https://s3.region.amazonaws.com/bucket/key
      // - Custom domain: https://cdn.example.com/key

      let key = urlObj.pathname.startsWith("/")
        ? urlObj.pathname.slice(1)
        : urlObj.pathname;

      // If using path-style URL (s3.region.amazonaws.com/bucket/key)
      if (
        urlObj.hostname.includes("s3.") &&
        key.startsWith(`${this.bucketName}/`)
      ) {
        key = key.slice(this.bucketName.length + 1);
      }

      return key || null;
    } catch {
      return null;
    }
  }
}
