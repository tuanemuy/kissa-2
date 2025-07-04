import type { Result } from "neverthrow";
import { AnyError } from "@/lib/error";

export class StorageServiceError extends AnyError {
  override readonly name = "StorageServiceError";

  constructor(message: string, cause?: unknown) {
    super(message, undefined, cause);
  }
}

export interface UploadedFile {
  id: string;
  originalName: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface UploadFileParams {
  file: Buffer | Uint8Array;
  originalName: string;
  mimeType: string;
  folder?: string;
}

export interface StorageService {
  uploadFile(
    params: UploadFileParams,
  ): Promise<Result<UploadedFile, StorageServiceError>>;

  uploadMultipleFiles(
    files: UploadFileParams[],
  ): Promise<Result<UploadedFile[], StorageServiceError>>;

  deleteFile(url: string): Promise<Result<void, StorageServiceError>>;

  deleteMultipleFiles(
    urls: string[],
  ): Promise<Result<void, StorageServiceError>>;

  getFileInfo(
    url: string,
  ): Promise<Result<UploadedFile | null, StorageServiceError>>;

  generateUploadUrl(
    filename: string,
    mimeType: string,
    folder?: string,
  ): Promise<
    Result<{ uploadUrl: string; fileUrl: string }, StorageServiceError>
  >;
}
