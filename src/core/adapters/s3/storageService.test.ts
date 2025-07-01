import { beforeEach, describe, expect, it } from "vitest";
import { MockStorageService } from "@/core/adapters/mock/storageService";
import type { StorageService } from "@/core/domain/region/ports/storageService";

describe("StorageService", () => {
  let storageService: StorageService;

  beforeEach(() => {
    storageService = new MockStorageService();
  });

  describe("uploadFile", () => {
    it("should upload file successfully", async () => {
      const params = {
        file: Buffer.from("test file content"),
        originalName: "test.txt",
        mimeType: "text/plain",
        folder: "uploads",
      };

      const result = await storageService.uploadFile(params);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.originalName).toBe("test.txt");
        expect(result.value.mimeType).toBe("text/plain");
        expect(result.value.size).toBe(17);
        expect(result.value.url).toContain("uploads/");
      }
    });

    it("should handle upload failure", async () => {
      const mockStorageService = storageService as MockStorageService;
      mockStorageService.setFailureMode(true);

      const params = {
        file: Buffer.from("test file content"),
        originalName: "test.txt",
        mimeType: "text/plain",
      };

      const result = await storageService.uploadFile(params);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Mock upload failure");
      }
    });
  });

  describe("uploadMultipleFiles", () => {
    it("should upload multiple files successfully", async () => {
      const files = [
        {
          file: Buffer.from("file1 content"),
          originalName: "file1.txt",
          mimeType: "text/plain",
        },
        {
          file: Buffer.from("file2 content"),
          originalName: "file2.txt",
          mimeType: "text/plain",
        },
      ];

      const result = await storageService.uploadMultipleFiles(files);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toHaveLength(2);
        expect(result.value[0].originalName).toBe("file1.txt");
        expect(result.value[1].originalName).toBe("file2.txt");
      }
    });

    it("should handle upload failure for multiple files", async () => {
      const mockStorageService = storageService as MockStorageService;
      mockStorageService.setFailureMode(true);

      const files = [
        {
          file: Buffer.from("file1 content"),
          originalName: "file1.txt",
          mimeType: "text/plain",
        },
      ];

      const result = await storageService.uploadMultipleFiles(files);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Mock upload failure");
      }
    });
  });

  describe("deleteFile", () => {
    it("should delete file successfully", async () => {
      const url = "https://mock-storage.example.com/uploads/test.txt";
      const result = await storageService.deleteFile(url);

      expect(result.isOk()).toBe(true);
    });

    it("should handle delete failure", async () => {
      const mockStorageService = storageService as MockStorageService;
      mockStorageService.setFailureMode(true);

      const result = await storageService.deleteFile("some-url");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Mock delete failure");
      }
    });
  });

  describe("deleteMultipleFiles", () => {
    it("should delete multiple files successfully", async () => {
      const urls = [
        "https://mock-storage.example.com/uploads/test1.txt",
        "https://mock-storage.example.com/uploads/test2.txt",
      ];

      const result = await storageService.deleteMultipleFiles(urls);

      expect(result.isOk()).toBe(true);
    });

    it("should handle delete failure for multiple files", async () => {
      const mockStorageService = storageService as MockStorageService;
      mockStorageService.setFailureMode(true);

      const urls = ["url1", "url2"];
      const result = await storageService.deleteMultipleFiles(urls);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Mock delete failure");
      }
    });
  });

  describe("getFileInfo", () => {
    it("should get file info successfully for existing file", async () => {
      // First upload a file to have data to query
      const uploadParams = {
        file: Buffer.from("test file content"),
        originalName: "test.txt",
        mimeType: "text/plain",
        folder: "uploads",
      };

      const uploadResult = await storageService.uploadFile(uploadParams);
      expect(uploadResult.isOk()).toBe(true);

      if (uploadResult.isOk()) {
        const result = await storageService.getFileInfo(uploadResult.value.url);

        expect(result.isOk()).toBe(true);
        if (result.isOk() && result.value) {
          expect(result.value.originalName).toBe("test.txt");
          expect(result.value.size).toBe(17);
          expect(result.value.mimeType).toBe("text/plain");
        }
      }
    });

    it("should return null for non-existent file", async () => {
      const url = "https://mock-storage.example.com/uploads/non-existent.txt";
      const result = await storageService.getFileInfo(url);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBeNull();
      }
    });

    it("should handle failure when getting file info", async () => {
      const mockStorageService = storageService as MockStorageService;
      mockStorageService.setFailureMode(true);

      const result = await storageService.getFileInfo("some-url");

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Mock get file info failure");
      }
    });
  });

  describe("generateUploadUrl", () => {
    it("should generate upload URL successfully", async () => {
      const result = await storageService.generateUploadUrl(
        "test.txt",
        "text/plain",
        "uploads",
      );

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.uploadUrl).toContain("mock-storage.example.com");
        expect(result.value.fileUrl).toContain("uploads/");
      }
    });

    it("should handle failure when generating upload URL", async () => {
      const mockStorageService = storageService as MockStorageService;
      mockStorageService.setFailureMode(true);

      const result = await storageService.generateUploadUrl(
        "test.txt",
        "text/plain",
        "uploads",
      );

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.message).toBe("Mock generate upload URL failure");
      }
    });
  });

  describe("MockStorageService utilities", () => {
    it("should track uploaded files", async () => {
      const mockStorageService = storageService as MockStorageService;

      const params = {
        file: Buffer.from("test content"),
        originalName: "test.txt",
        mimeType: "text/plain",
      };

      await storageService.uploadFile(params);

      const uploadedFiles = mockStorageService.getUploadedFiles();
      expect(uploadedFiles).toHaveLength(1);
      expect(uploadedFiles[0].originalName).toBe("test.txt");
    });

    it("should reset uploaded files", async () => {
      const mockStorageService = storageService as MockStorageService;

      const params = {
        file: Buffer.from("test content"),
        originalName: "test.txt",
        mimeType: "text/plain",
      };

      await storageService.uploadFile(params);
      expect(mockStorageService.getUploadedFiles()).toHaveLength(1);

      mockStorageService.reset();
      expect(mockStorageService.getUploadedFiles()).toHaveLength(0);
    });

    it("should check if file exists by URL", async () => {
      const mockStorageService = storageService as MockStorageService;

      const params = {
        file: Buffer.from("test content"),
        originalName: "test.txt",
        mimeType: "text/plain",
      };

      const uploadResult = await storageService.uploadFile(params);
      expect(uploadResult.isOk()).toBe(true);

      if (uploadResult.isOk()) {
        expect(mockStorageService.hasFile(uploadResult.value.url)).toBe(true);
        expect(mockStorageService.hasFile("non-existent-url")).toBe(false);
      }
    });
  });
});
