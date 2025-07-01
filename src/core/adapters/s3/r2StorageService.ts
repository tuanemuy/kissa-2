import type { StorageService } from "@/core/domain/region/ports/storageService";
import {
  S3StorageService,
  type S3StorageServiceConfig,
} from "./storageService";

export interface R2StorageServiceConfig {
  bucketName: string;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrlBase?: string;
}

export class R2StorageService
  extends S3StorageService
  implements StorageService
{
  constructor(config: R2StorageServiceConfig) {
    const s3Config: S3StorageServiceConfig = {
      bucketName: config.bucketName,
      region: "auto", // R2 uses "auto" as region
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      publicUrlBase:
        config.publicUrlBase ||
        `https://${config.bucketName}.${config.accountId}.r2.cloudflarestorage.com`,
    };

    super(s3Config);
  }
}

// Factory function to create appropriate storage service based on configuration
export function createStorageService(config: {
  provider: "s3" | "r2";
  bucketName: string;
  region?: string;
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  publicUrlBase?: string;
}): StorageService {
  switch (config.provider) {
    case "s3":
      return new S3StorageService({
        bucketName: config.bucketName,
        region: config.region || "us-east-1",
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        endpoint: config.endpoint,
        publicUrlBase: config.publicUrlBase,
      });

    case "r2":
      if (!config.accountId) {
        throw new Error("accountId is required for R2 storage");
      }
      if (!config.accessKeyId || !config.secretAccessKey) {
        throw new Error(
          "accessKeyId and secretAccessKey are required for R2 storage",
        );
      }

      return new R2StorageService({
        bucketName: config.bucketName,
        accountId: config.accountId,
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
        publicUrlBase: config.publicUrlBase,
      });

    default:
      throw new Error(`Unsupported storage provider: ${config.provider}`);
  }
}
