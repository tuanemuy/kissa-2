"use client";

import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
} from "lucide-react";
import {
  startTransition,
  useActionState,
  useCallback,
  useEffect,
  useState,
} from "react";
import { toast } from "sonner";
import { createCheckinAction } from "@/actions/checkins";
import { ImageUploader } from "@/components/common/ImageUploader";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CheckinButtonProps {
  placeId: string;
  placeName: string;
  placeCoordinates?: {
    latitude: number;
    longitude: number;
  };
  isAuthenticated: boolean;
}

// Maximum allowed distance for checkin (in meters)
const MAX_CHECKIN_DISTANCE = 500;

interface UploadedImage {
  url: string;
  name: string;
  size: number;
  file?: File;
}

export function CheckinButton({
  placeId,
  placeName,
  placeCoordinates,
  isAuthenticated,
}: CheckinButtonProps) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<UploadedImage[]>([]);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
  } | null>(null);
  const [distanceToPlace, setDistanceToPlace] = useState<number | null>(null);
  const [locationStatus, setLocationStatus] = useState<
    "none" | "getting" | "success" | "error" | "too-far"
  >("none");

  const [actionState, formAction, isPending] = useActionState(
    createCheckinAction,
    { result: undefined, error: null },
  );

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      const R = 6371000; // Earth's radius in meters
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    [],
  );

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("このブラウザでは位置情報がサポートされていません。");
      return;
    }

    setLocationStatus("getting");
    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };

        setUserLocation(location);
        setIsGettingLocation(false);

        // Calculate distance if place coordinates are available
        if (placeCoordinates) {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            placeCoordinates.latitude,
            placeCoordinates.longitude,
          );
          setDistanceToPlace(distance);

          if (distance <= MAX_CHECKIN_DISTANCE) {
            setLocationStatus("success");
          } else {
            setLocationStatus("too-far");
          }
        } else {
          setLocationStatus("success");
        }
      },
      (error) => {
        setIsGettingLocation(false);
        setLocationStatus("error");
        console.error("Geolocation error:", error);

        let errorMessage = "位置情報の取得に失敗しました。";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "位置情報へのアクセスが拒否されました。ブラウザの設定を確認してください。";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "位置情報が利用できません。";
            break;
          case error.TIMEOUT:
            errorMessage = "位置情報の取得がタイムアウトしました。";
            break;
        }
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000, // Allow cached location up to 30 seconds old
      },
    );
  }, [placeCoordinates, calculateDistance]);

  const handleCheckin = () => {
    if (!isAuthenticated) {
      window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    if (!userLocation) {
      toast.error("位置情報を取得してからチェックインしてください。");
      return;
    }

    if (locationStatus === "too-far") {
      toast.error(
        `チェックインするには場所から${MAX_CHECKIN_DISTANCE}m以内にいる必要があります。`,
      );
      return;
    }

    const formData = new FormData();
    formData.append("placeId", placeId);
    formData.append("comment", comment);
    formData.append("latitude", userLocation.latitude.toString());
    formData.append("longitude", userLocation.longitude.toString());
    formData.append("isPrivate", "false");

    // Add photos data
    photos.forEach((photo, index) => {
      formData.append(`photos[${index}][url]`, photo.url);
      formData.append(`photos[${index}][caption]`, ""); // Optional caption, can be added later
    });

    startTransition(() => {
      formAction(formData);
    });
  };

  // Auto-get location when dialog opens
  useEffect(() => {
    if (open && !userLocation && locationStatus === "none") {
      getCurrentLocation();
    }
  }, [open, userLocation, locationStatus, getCurrentLocation]);

  // Show success/error toasts based on action state
  useEffect(() => {
    if (actionState.error && isPending === false) {
      // Handle specific error types
      const error = actionState.error;
      if ("code" in error && error.code === "CHECKIN_TOO_FAR") {
        toast.error(
          `この場所から${MAX_CHECKIN_DISTANCE}m以内でチェックインしてください。`,
        );
      } else if (
        "code" in error &&
        error.code === "LOCATION_VALIDATION_FAILED"
      ) {
        toast.error("位置情報の確認に失敗しました。もう一度お試しください。");
      } else {
        toast.error("チェックインに失敗しました。");
      }
    }

    if (
      !actionState.error &&
      isPending === false &&
      actionState.result !== undefined
    ) {
      toast.success("チェックインしました！");
      setOpen(false);
      setComment("");
      setPhotos([]);
      setUserLocation(null);
      setDistanceToPlace(null);
      setLocationStatus("none");
    }
  }, [actionState, isPending]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="w-full"
          size="sm"
          disabled={!isAuthenticated}
        >
          <Clock className="h-4 w-4 mr-2" />
          チェックイン
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MapPin className="h-5 w-5 mr-2" />
            {placeName}にチェックイン
          </DialogTitle>
          <DialogDescription>
            この場所での体験をシェアしましょう。位置情報を確認してチェックインします。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Location Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>位置情報の確認</Label>
              {locationStatus === "success" && (
                <Badge variant="default" className="text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  確認済み
                </Badge>
              )}
              {locationStatus === "too-far" && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  範囲外
                </Badge>
              )}
            </div>

            {/* Location details */}
            {userLocation && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4" />
                  <span>位置情報を取得しました</span>
                </div>
                {distanceToPlace !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      この場所からの距離:
                    </span>
                    <span
                      className={`font-medium ${
                        distanceToPlace <= MAX_CHECKIN_DISTANCE
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {distanceToPlace < 1000
                        ? `${Math.round(distanceToPlace)}m`
                        : `${(distanceToPlace / 1000).toFixed(1)}km`}
                    </span>
                  </div>
                )}
                {userLocation.accuracy && (
                  <div className="text-xs text-muted-foreground mt-1">
                    精度: ±{Math.round(userLocation.accuracy)}m
                  </div>
                )}
              </div>
            )}

            {/* Location warnings */}
            {locationStatus === "too-far" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  チェックインするには場所から{MAX_CHECKIN_DISTANCE}
                  m以内にいる必要があります。 現在の距離:{" "}
                  {distanceToPlace && distanceToPlace < 1000
                    ? `${Math.round(distanceToPlace)}m`
                    : `${distanceToPlace && (distanceToPlace / 1000).toFixed(1)}km`}
                </AlertDescription>
              </Alert>
            )}

            {locationStatus === "error" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  位置情報の取得に失敗しました。ブラウザの設定を確認して再試行してください。
                </AlertDescription>
              </Alert>
            )}

            {/* Get location button */}
            {(locationStatus === "none" || locationStatus === "error") && (
              <Button
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="w-full"
              >
                {isGettingLocation ? (
                  <>
                    <Navigation className="h-4 w-4 mr-2 animate-spin" />
                    位置情報を取得中...
                  </>
                ) : (
                  <>
                    <Navigation className="h-4 w-4 mr-2" />
                    位置情報を取得
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Comment section */}
          <div>
            <Label htmlFor="comment">コメント（任意）</Label>
            <Textarea
              id="comment"
              placeholder="この場所での体験を教えてください..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Photo upload section */}
          <div>
            <Label className="flex items-center">
              <Camera className="h-4 w-4 mr-2" />
              写真（任意）
            </Label>
            <div className="mt-2">
              <ImageUploader
                onImagesChange={setPhotos}
                maxImages={5}
                maxFileSize={3}
                initialImages={photos}
                disabled={isPending || isGettingLocation}
              />
            </div>
            {photos.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {photos.length}枚の写真が選択されています
              </p>
            )}
          </div>

          {/* Checkin button */}
          <Button
            onClick={handleCheckin}
            disabled={
              isPending ||
              isGettingLocation ||
              !userLocation ||
              locationStatus === "too-far"
            }
            className="w-full"
          >
            {isPending ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                チェックイン中...
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-2" />
                チェックイン
              </>
            )}
          </Button>

          {!isAuthenticated && (
            <p className="text-xs text-muted-foreground text-center">
              チェックインするにはログインが必要です
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
