import { err, ok, type Result } from "neverthrow";
import { promises as fs } from "fs";
import path from "path";
import { v7 as uuidv7 } from "uuid";
import {
  type StorageService,
  StorageServiceError,
  type UploadedFile,
  type UploadFileParams,
} from "@/core/domain/region/ports/storageService";
import { ERROR_CODES } from "@/lib/errorCodes";

export interface LocalStorageConfig {
  uploadDir: string;
  baseUrl: string;
  maxFileSize: number; // in bytes
  allowedMimeTypes: string[];
}

export class LocalStorageService implements StorageService {
  constructor(private readonly config: LocalStorageConfig) {}

  async uploadFile(
    params: UploadFileParams
  ): Promise<Result<UploadedFile, StorageServiceError>> {
    try {
      // Validate file size
      if (params.file.length > this.config.maxFileSize) {
        return err(
          new StorageServiceError(
            `File size exceeds maximum allowed size of ${this.config.maxFileSize} bytes`,
            ERROR_CODES.STORAGE_SERVICE_FAILED
          )
        );
      }

      // Validate MIME type
      if (!this.config.allowedMimeTypes.includes(params.mimeType)) {
        return err(
          new StorageServiceError(
            `MIME type ${params.mimeType} is not allowed`,
            ERROR_CODES.STORAGE_SERVICE_FAILED
          )
        );
      }

      // Generate unique filename
      const fileExtension = path.extname(params.originalName);
      const uniqueId = uuidv7();
      const filename = `${uniqueId}${fileExtension}`;
      
      // Create folder structure
      const folder = params.folder || "uploads";
      const folderPath = path.join(this.config.uploadDir, folder);
      await fs.mkdir(folderPath, { recursive: true });

      // Write file
      const filePath = path.join(folderPath, filename);
      await fs.writeFile(filePath, params.file);

      // Generate file URL
      const url = `${this.config.baseUrl}/${folder}/${filename}`;

      const uploadedFile: UploadedFile = {
        id: uniqueId,
        originalName: params.originalName,
        filename,
        url,
        size: params.file.length,
        mimeType: params.mimeType,
        uploadedAt: new Date(),
      };

      return ok(uploadedFile);
    } catch (error) {
      return err(
        new StorageServiceError(
          "Failed to upload file",
          ERROR_CODES.STORAGE_SERVICE_FAILED,
          error
        )
      );
    }
  }

  async uploadMultipleFiles(
    files: UploadFileParams[]
  ): Promise<Result<UploadedFile[], StorageServiceError>> {
    try {
      const results: UploadedFile[] = [];

      for (const fileParams of files) {
        const uploadResult = await this.uploadFile(fileParams);
        if (uploadResult.isErr()) {
          return err(uploadResult.error);
        }
        results.push(uploadResult.value);
      }

      return ok(results);
    } catch (error) {
      return err(
        new StorageServiceError(
          "Failed to upload multiple files",
          ERROR_CODES.STORAGE_SERVICE_FAILED,
          error
        )
      );
    }
  }

  async deleteFile(url: string): Promise<Result<void, StorageServiceError>> {
    try {
      // Extract filename from URL
      const filename = this.extractFilenameFromUrl(url);
      if (!filename) {
        return err(
          new StorageServiceError(
            "Invalid file URL",
            ERROR_CODES.VALIDATION_ERROR
          )
        );
      }

      // Delete file
      const filePath = path.join(this.config.uploadDir, filename);
      await fs.unlink(filePath);

      return ok(undefined);
    } catch (error) {
      return err(
        new StorageServiceError(
          "Failed to delete file",
          ERROR_CODES.STORAGE_SERVICE_FAILED,
          error
        )
      );
    }
  }

  async deleteMultipleFiles(
    urls: string[]
  ): Promise<Result<void, StorageServiceError>> {
    try {
      for (const url of urls) {
        const deleteResult = await this.deleteFile(url);
        if (deleteResult.isErr()) {
          // Log error but continue with other files
          console.error("Failed to delete file:", url, deleteResult.error);
        }
      }

      return ok(undefined);
    } catch (error) {
      return err(
        new StorageServiceError(
          "Failed to delete multiple files",
          ERROR_CODES.STORAGE_SERVICE_FAILED,
          error
        )
      );
    }
  }

  async getFileInfo(
    url: string
  ): Promise<Result<UploadedFile | null, StorageServiceError>> {
    try {
      // Extract filename from URL
      const filename = this.extractFilenameFromUrl(url);
      if (!filename) {
        return err(
          new StorageServiceError(
            "Invalid file URL",
            ERROR_CODES.VALIDATION_ERROR
          )
        );
      }

      // Get file stats
      const filePath = path.join(this.config.uploadDir, filename);
      const stats = await fs.stat(filePath);

      // Extract file ID from filename (assuming it's the UUID part)
      const basename = path.basename(filename, path.extname(filename));
      
      const fileInfo: UploadedFile = {
        id: basename,
        originalName: filename,
        filename,
        url,
        size: stats.size,
        mimeType: this.getMimeTypeFromExtension(path.extname(filename)),
        uploadedAt: stats.birthtime,
      };

      return ok(fileInfo);
    } catch (error) {
      if ((error as any).code === "ENOENT") {
        return ok(null);
      }
      return err(
        new StorageServiceError(
          "Failed to get file info",
          ERROR_CODES.STORAGE_SERVICE_FAILED,
          error
        )
      );
    }
  }

  async generateUploadUrl(
    filename: string,
    mimeType: string,
    folder?: string
  ): Promise<
    Result<{ uploadUrl: string; fileUrl: string }, StorageServiceError>
  > {
    try {
      // For local storage, we can just return the direct upload endpoint
      // In a real implementation, this would generate a presigned URL
      const uniqueId = uuidv7();
      const fileExtension = path.extname(filename);
      const finalFilename = `${uniqueId}${fileExtension}`;
      const uploadPath = folder ? `${folder}/${finalFilename}` : finalFilename;
      
      const uploadUrl = `${this.config.baseUrl}/upload/${uploadPath}`;
      const fileUrl = `${this.config.baseUrl}/${uploadPath}`;

      return ok({ uploadUrl, fileUrl });
    } catch (error) {
      return err(
        new StorageServiceError(
          "Failed to generate upload URL",
          ERROR_CODES.STORAGE_SERVICE_FAILED,
          error
        )
      );
    }
  }

  private extractFilenameFromUrl(url: string): string | null {
    try {
      const urlParts = url.replace(this.config.baseUrl, "").split("/");
      return urlParts.slice(1).join("/"); // Remove leading slash and join
    } catch {
      return null;
    }
  }

  private getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".pdf": "application/pdf",
      ".txt": "text/plain",
      ".doc": "application/msword",
      ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    };

    return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
  }
}