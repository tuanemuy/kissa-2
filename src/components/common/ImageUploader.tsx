"use client";

import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface UploadedImage {
  url: string;
  name: string;
  size: number;
  file?: File;
}

interface ImageUploaderProps {
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  initialImages?: UploadedImage[];
  disabled?: boolean;
}

export function ImageUploader({
  onImagesChange,
  maxImages = 10,
  maxFileSize = 5,
  acceptedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"],
  className = "",
  initialImages = [],
  disabled = false,
}: ImageUploaderProps) {
  const [images, setImages] = useState<UploadedImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `ファイル形式がサポートされていません。${acceptedTypes.join(", ")}のみ対応しています。`;
      }

      if (file.size > maxFileSize * 1024 * 1024) {
        return `ファイルサイズが大きすぎます。${maxFileSize}MB以下のファイルを選択してください。`;
      }

      return null;
    },
    [acceptedTypes, maxFileSize],
  );

  const simulateUpload = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, _reject) => {
      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          clearInterval(interval);
          setUploadProgress(100);
          // For demo purposes, create a local URL
          // In production, this would be replaced with actual upload logic
          const url = URL.createObjectURL(file);
          resolve(url);
        } else {
          setUploadProgress(progress);
        }
      }, 200);
    });
  }, []);

  const processFiles = useCallback(
    async (files: File[]) => {
      if (disabled) return;

      setError(null);

      // Check if adding these files would exceed the max limit
      if (images.length + files.length > maxImages) {
        setError(`最大${maxImages}枚まで追加できます。`);
        return;
      }

      // Validate all files first
      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        const uploadPromises = files.map(async (file) => {
          const url = await simulateUpload(file);
          return {
            url,
            name: file.name,
            size: file.size,
            file,
          };
        });

        const uploadedImages = await Promise.all(uploadPromises);
        const newImages = [...images, ...uploadedImages];

        setImages(newImages);
        onImagesChange(newImages);
      } catch (_error) {
        setError(
          "アップロード中にエラーが発生しました。もう一度お試しください。",
        );
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    },
    [images, maxImages, disabled, onImagesChange, simulateUpload, validateFile],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      processFiles(acceptedFiles);
    },
    [processFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce(
      (acc, type) => {
        acc[type] = [];
        return acc;
      },
      {} as Record<string, string[]>,
    ),
    disabled,
    multiple: true,
    maxFiles: maxImages - images.length,
  });

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange(newImages);
  };

  const _reorderImages = (fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    setImages(newImages);
    onImagesChange(newImages);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <input {...getInputProps()} />
          {uploading ? (
            <div className="space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  アップロード中...
                </p>
                <Progress value={uploadProgress} className="w-48" />
                <p className="text-xs text-muted-foreground">
                  {Math.round(uploadProgress)}%
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">
                  {isDragActive
                    ? "ここにファイルをドロップしてください"
                    : "画像をドラッグ&ドロップまたはクリックして選択"}
                </p>
                <p className="text-sm text-muted-foreground">
                  最大{maxImages}枚、{maxFileSize}MB以下のJPEG、PNG、WebP形式
                </p>
                <p className="text-xs text-muted-foreground">
                  {images.length > 0 && `現在${images.length}枚選択済み`}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                ファイルを選択
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Selected Images */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              選択された画像 ({images.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setImages([]);
                onImagesChange([]);
              }}
              disabled={disabled}
            >
              すべて削除
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <Card key={image.url} className="overflow-hidden">
                <div className="relative aspect-square">
                  <Image
                    src={image.url}
                    alt={image.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                    disabled={disabled}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <CardContent className="p-2">
                  <p
                    className="text-xs font-medium truncate"
                    title={image.name}
                  >
                    {image.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(image.size)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      {images.length === 0 && !uploading && (
        <div className="text-center text-sm text-muted-foreground">
          <p>画像を追加してギャラリーを作成しましょう</p>
        </div>
      )}
    </div>
  );
}
