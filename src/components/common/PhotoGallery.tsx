"use client";

import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Photo {
  url: string;
  alt?: string;
  caption?: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  className?: string;
  showThumbnails?: boolean;
  maxHeight?: number;
  aspectRatio?: "square" | "video" | "auto";
}

export function PhotoGallery({
  photos,
  className = "",
  showThumbnails = true,
  maxHeight = 400,
  aspectRatio = "auto",
}: PhotoGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-muted rounded-lg h-64 ${className}`}
      >
        <p className="text-muted-foreground">画像がありません</p>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const nextLightboxPhoto = () => {
    setLightboxIndex((prev) => (prev + 1) % photos.length);
  };

  const prevLightboxPhoto = () => {
    setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square";
      case "video":
        return "aspect-video";
      default:
        return "";
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image */}
      <div className="relative group">
        <div
          className={`relative overflow-hidden rounded-lg bg-muted ${getAspectRatioClass()}`}
          style={aspectRatio === "auto" ? { maxHeight } : undefined}
        >
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.alt || `Photo ${currentIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={prevPhoto}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={nextPhoto}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Zoom button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => openLightbox(currentIndex)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Photo counter */}
          {photos.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
              {currentIndex + 1} / {photos.length}
            </div>
          )}
        </div>

        {/* Caption */}
        {currentPhoto.caption && (
          <p className="text-sm text-muted-foreground mt-2">
            {currentPhoto.caption}
          </p>
        )}
      </div>

      {/* Thumbnails */}
      {showThumbnails && photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {photos.map((photo, index) => (
            <button
              type="button"
              key={photo.url}
              className={`relative flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground"
              }`}
              onClick={() => setCurrentIndex(index)}
            >
              <Image
                src={photo.url}
                alt={photo.alt || `Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-7xl w-full h-full max-h-screen p-0 bg-black/95">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-50 text-white hover:bg-white/20"
                  onClick={prevLightboxPhoto}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 text-white hover:bg-white/20"
                  onClick={nextLightboxPhoto}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Image */}
            <div className="relative w-full h-full p-8">
              <Image
                src={photos[lightboxIndex].url}
                alt={photos[lightboxIndex].alt || `Photo ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
              />
            </div>

            {/* Info bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4">
              <div className="flex justify-between items-center">
                <div>
                  {photos[lightboxIndex].caption && (
                    <p className="text-sm">{photos[lightboxIndex].caption}</p>
                  )}
                </div>
                <div className="text-sm">
                  {lightboxIndex + 1} / {photos.length}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
