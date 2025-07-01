import { err, ok, type Result } from "neverthrow";
import type {
  StorageService,
  UploadedFile,
  UploadFileParams,
} from "@/core/domain/region/ports/storageService";
import { StorageServiceError } from "@/core/domain/region/ports/storageService";

export class MockStorageService implements StorageService {
  private files: Map<string, UploadedFile> = new Map();
  private shouldFail = false;

  constructor(shouldFail = false) {
    this.shouldFail = shouldFail;
  }

  async uploadFile(
    params: UploadFileParams,
  ): Promise<Result<UploadedFile, StorageServiceError>> {
    if (this.shouldFail) {
      return err(new StorageServiceError("Mock upload failure"));
    }

    const file: UploadedFile = {
      id: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      originalName: params.originalName,
      filename: `${Date.now()}-${params.originalName}`,
      url: `https://mock-storage.example.com/${params.folder || "uploads"}/${Date.now()}-${params.originalName}`,
      size: params.file.length,
      mimeType: params.mimeType,
      uploadedAt: new Date(),
    };

    this.files.set(file.url, file);
    return ok(file);
  }

  async uploadMultipleFiles(
    files: UploadFileParams[],
  ): Promise<Result<UploadedFile[], StorageServiceError>> {
    if (this.shouldFail) {
      return err(new StorageServiceError("Mock upload failure"));
    }

    const uploadedFiles: UploadedFile[] = [];

    for (const fileParams of files) {
      const result = await this.uploadFile(fileParams);
      if (result.isErr()) {
        return err(result.error);
      }
      uploadedFiles.push(result.value);
    }

    return ok(uploadedFiles);
  }

  async deleteFile(url: string): Promise<Result<void, StorageServiceError>> {
    if (this.shouldFail) {
      return err(new StorageServiceError("Mock delete failure"));
    }

    this.files.delete(url);
    return ok(undefined);
  }

  async deleteMultipleFiles(
    urls: string[],
  ): Promise<Result<void, StorageServiceError>> {
    if (this.shouldFail) {
      return err(new StorageServiceError("Mock delete failure"));
    }

    for (const url of urls) {
      this.files.delete(url);
    }

    return ok(undefined);
  }

  async getFileInfo(
    url: string,
  ): Promise<Result<UploadedFile | null, StorageServiceError>> {
    if (this.shouldFail) {
      return err(new StorageServiceError("Mock get file info failure"));
    }

    const file = this.files.get(url);
    return ok(file || null);
  }

  async generateUploadUrl(
    filename: string,
    _mimeType: string,
    folder?: string,
  ): Promise<
    Result<{ uploadUrl: string; fileUrl: string }, StorageServiceError>
  > {
    if (this.shouldFail) {
      return err(new StorageServiceError("Mock generate upload URL failure"));
    }

    const uploadUrl = `https://mock-storage.example.com/upload/${Date.now()}-${filename}`;
    const fileUrl = `https://mock-storage.example.com/${folder || "uploads"}/${Date.now()}-${filename}`;

    return ok({ uploadUrl, fileUrl });
  }

  // Test utilities
  reset(): void {
    this.files.clear();
  }

  setFailureMode(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  getUploadedFiles(): UploadedFile[] {
    return Array.from(this.files.values());
  }

  hasFile(url: string): boolean {
    return this.files.has(url);
  }
}
