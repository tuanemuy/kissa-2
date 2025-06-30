"use client";

import type * as L from "leaflet";
import {
  ExternalLink,
  Layers,
  MapPin,
  Navigation,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Dynamic imports for Leaflet to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false },
);

interface MapLocation {
  id: string;
  latitude: number;
  longitude: number;
  name: string;
  category?: string;
  address?: string;
  description?: string;
}

interface PlaceMapProps {
  locations: MapLocation[];
  center?: { latitude: number; longitude: number };
  zoom?: number;
  height?: string;
  showControls?: boolean;
  onLocationClick?: (location: MapLocation) => void;
  selectedLocationId?: string;
  className?: string;
}

type MapType = "roadmap" | "satellite" | "hybrid" | "terrain";

// Map tile layers for different map types
const getTileLayerUrl = (mapType: MapType): string => {
  switch (mapType) {
    case "roadmap":
      return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    case "satellite":
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    case "hybrid":
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    case "terrain":
      return "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
    default:
      return "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  }
};

const getTileLayerAttribution = (mapType: MapType): string => {
  switch (mapType) {
    case "roadmap":
      return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    case "satellite":
    case "hybrid":
      return "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community";
    case "terrain":
      return 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)';
    default:
      return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  }
};

export function PlaceMap({
  locations,
  center,
  zoom = 13,
  height = "400px",
  showControls = true,
  onLocationClick,
  selectedLocationId: _selectedLocationId,
  className = "",
}: PlaceMapProps) {
  const [mapType, setMapType] = useState<MapType>("roadmap");
  const [currentZoom, _setCurrentZoom] = useState(zoom);
  const [mapCenter, setMapCenter] = useState(
    center ||
      (locations.length > 0
        ? { latitude: locations[0].latitude, longitude: locations[0].longitude }
        : { latitude: 35.6762, longitude: 139.6503 }), // Default to Tokyo
  );
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapRef, setMapRef] = useState<L.Map | null>(null);

  useEffect(() => {
    setIsMapReady(true);
  }, []);

  // Calculate bounds to fit all locations
  const getBounds = () => {
    if (locations.length === 0) return null;

    const latitudes = locations.map((loc) => loc.latitude);
    const longitudes = locations.map((loc) => loc.longitude);

    return {
      north: Math.max(...latitudes),
      south: Math.min(...latitudes),
      east: Math.max(...longitudes),
      west: Math.min(...longitudes),
    };
  };

  const fitToBounds = () => {
    if (!mapRef || locations.length === 0) return;

    const bounds = getBounds();
    if (!bounds) return;

    // Use Leaflet's fitBounds method
    mapRef.fitBounds(
      [
        [bounds.south, bounds.west],
        [bounds.north, bounds.east],
      ],
      { padding: [20, 20] },
    );
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setUserLocation(location);
        setMapCenter(location);
        setIsLoadingLocation(false);
      },
      () => {
        setIsLoadingLocation(false);
      },
    );
  };

  const zoomIn = () => {
    if (mapRef) {
      mapRef.setZoom(mapRef.getZoom() + 1);
    }
  };

  const zoomOut = () => {
    if (mapRef) {
      mapRef.setZoom(mapRef.getZoom() - 1);
    }
  };

  const openInGoogleMaps = () => {
    let lat = mapCenter.latitude;
    let lng = mapCenter.longitude;
    let zoomLevel = currentZoom;

    if (mapRef) {
      const center = mapRef.getCenter();
      lat = center.lat;
      lng = center.lng;
      zoomLevel = mapRef.getZoom();
    }

    const params = new URLSearchParams({
      q: `${lat},${lng}`,
      z: zoomLevel.toString(),
    });
    window.open(`https://maps.google.com/?${params.toString()}`, "_blank");
  };

  // Custom icon for location markers
  const createCustomIcon = (category?: string) => {
    if (typeof window === "undefined") return null;

    const L = require("leaflet");

    // Color mapping
    const colorMap: Record<string, string> = {
      restaurant: "#ef4444",
      cafe: "#f97316",
      hotel: "#3b82f6",
      shopping: "#a855f7",
      entertainment: "#ec4899",
      culture: "#6366f1",
      nature: "#22c55e",
      historical: "#eab308",
      religious: "#6b7280",
      transportation: "#06b6d4",
      hospital: "#dc2626",
      education: "#2563eb",
      office: "#4b5563",
      other: "#9ca3af",
    };

    const color = colorMap[category || "other"] || "#9ca3af";

    return L.divIcon({
      html: `
        <div style="
          width: 24px; 
          height: 24px; 
          background-color: ${color}; 
          border-radius: 50%; 
          border: 2px solid white; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
          display: flex; 
          align-items: center; 
          justify-content: center;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `,
      className: "custom-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -12],
    });
  };

  // User location icon
  const createUserLocationIcon = () => {
    if (typeof window === "undefined") return null;

    const L = require("leaflet");

    return L.divIcon({
      html: `
        <div style="
          width: 16px; 
          height: 16px; 
          background-color: #3b82f6; 
          border-radius: 50%; 
          border: 2px solid white; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          position: relative;
        ">
          <div style="
            width: 8px; 
            height: 8px; 
            background-color: #1d4ed8; 
            border-radius: 50%; 
            position: absolute; 
            top: 50%; 
            left: 50%; 
            transform: translate(-50%, -50%);
          "></div>
        </div>
      `,
      className: "user-location-marker",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  };

  if (!isMapReady) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div
          className="bg-muted rounded-lg flex items-center justify-center border"
          style={{ height }}
        >
          <p className="text-muted-foreground">地図を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Container */}
      <div className="relative">
        <MapContainer
          center={[mapCenter.latitude, mapCenter.longitude]}
          zoom={currentZoom}
          style={{ height, width: "100%" }}
          className="rounded-lg border"
          ref={setMapRef}
        >
          <TileLayer
            url={getTileLayerUrl(mapType)}
            attribution={getTileLayerAttribution(mapType)}
          />

          {/* Location Markers */}
          {locations.map((location) => (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={createCustomIcon(location.category)}
              eventHandlers={{
                click: () => onLocationClick?.(location),
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-medium">{location.name}</p>
                  {location.address && (
                    <p className="text-muted-foreground text-xs mt-1">
                      {location.address}
                    </p>
                  )}
                  {location.description && (
                    <p className="text-xs mt-1">{location.description}</p>
                  )}
                  {location.category && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {location.category}
                    </Badge>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* User Location */}
          {userLocation && (
            <Marker
              position={[userLocation.latitude, userLocation.longitude]}
              icon={createUserLocationIcon()}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-medium">あなたの現在地</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* User Location Circle */}
          {userLocation && (
            <Circle
              center={[userLocation.latitude, userLocation.longitude]}
              radius={100}
              pathOptions={{
                fillColor: "#3b82f6",
                color: "#3b82f6",
                fillOpacity: 0.2,
              }}
            />
          )}
        </MapContainer>

        {/* Map Controls */}
        {showControls && (
          <div className="absolute top-4 right-4 space-y-2 z-[1000]">
            <div className="bg-white rounded shadow-md">
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomIn}
                className="h-8 w-8"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="px-2 py-1 text-xs text-center border-t border-b bg-muted">
                {mapRef?.getZoom?.()?.toFixed(0) || currentZoom}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={zoomOut}
                className="h-8 w-8"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </div>

            <div className="bg-white rounded shadow-md p-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={getCurrentLocation}
                disabled={isLoadingLocation}
                className="h-8 w-8"
              >
                <Navigation
                  className={`h-4 w-4 ${isLoadingLocation ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        )}

        {/* Map Type Selector */}
        {showControls && (
          <div className="absolute top-4 left-4 z-[1000]">
            <Select
              value={mapType}
              onValueChange={(value: MapType) => setMapType(value)}
            >
              <SelectTrigger className="w-32 h-8 bg-white">
                <Layers className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="roadmap">道路</SelectItem>
                <SelectItem value="satellite">衛星</SelectItem>
                <SelectItem value="hybrid">ハイブリッド</SelectItem>
                <SelectItem value="terrain">地形</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* External Link */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          <Button
            variant="secondary"
            size="sm"
            onClick={openInGoogleMaps}
            className="h-8"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Google Maps
          </Button>
        </div>
      </div>

      {/* Map Info */}
      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{locations.length}件の場所</span>
          {userLocation && (
            <Badge variant="outline" className="text-xs">
              現在地表示中
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fitToBounds}
            disabled={locations.length === 0}
          >
            すべて表示
          </Button>
        </div>
      </div>

      {/* No locations message */}
      {locations.length === 0 && (
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription>表示する場所がありません。</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
