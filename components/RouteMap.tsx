'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Location data type
interface Location {
  id: number;
  filename: string;
  path: string;
  latitude: number;
  longitude: number;
  date: string | null;
}

interface LocationData {
  totalPhotos: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
    center: { lat: number; lng: number };
  } | null;
  route: number[][];
  locations: Location[];
}

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

const CircleMarker = dynamic(
  () => import('react-leaflet').then((mod) => mod.CircleMarker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface RouteMapProps {
  locations: LocationData;
  isExpanded?: boolean;
  onToggle?: () => void;
}

export default function RouteMap({ locations, isExpanded = false, onToggle }: RouteMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    // Check if mobile on mount and resize
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMounted || !locations.bounds) {
    return (
      <div className="bg-stone-200 rounded-lg flex items-center justify-center" style={{ height: isExpanded ? '500px' : '300px' }}>
        <p className="text-stone-500">Loading map...</p>
      </div>
    );
  }

  const { bounds, route, locations: photoLocations } = locations;

  // Convert route to LatLng format for Leaflet
  const routeLatLngs: [number, number][] = route.map(([lng, lat]) => [lat, lng]);

  return (
    <div className="relative">
      {/* Map container */}
      <div
        className={`rounded-lg overflow-hidden shadow-lg transition-all duration-300 ${
          isExpanded ? 'h-[500px]' : 'h-[300px]'
        }`}
      >
        <MapContainer
          key={isMobile ? 'mobile' : 'desktop'}
          center={[bounds.center.lat, bounds.center.lng]}
          zoom={isMobile ? 4 : 5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Route line */}
          {routeLatLngs.length > 0 && (
            <Polyline
              positions={routeLatLngs}
              pathOptions={{
                color: '#1c1917',
                weight: 3,
                opacity: 0.7,
                dashArray: '10, 10',
              }}
            />
          )}

          {/* Photo markers */}
          {photoLocations.map((location, idx) => (
            <CircleMarker
              key={`loc-${idx}-${location.latitude}-${location.longitude}`}
              center={[location.latitude, location.longitude]}
              radius={6}
              pathOptions={{
                color: '#1c1917',
                fillColor: '#fbbf24',
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">Photo {idx + 1}</p>
                  {location.date && (
                    <p className="text-stone-500 text-xs">{location.date}</p>
                  )}
                  <img
                    src={decodeURIComponent(location.path)}
                    alt={`Photo ${idx + 1}`}
                    className="mt-2 max-w-[200px] rounded"
                  />
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {/* Expand/collapse button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-full shadow-lg text-sm font-medium hover:bg-stone-50 transition-colors"
        >
          {isExpanded ? 'Collapse' : 'Expand'} Map
        </button>
      )}

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-4 h-0.5 bg-stone-900" style={{ borderStyle: 'dashed' }}></span>
          <span>Route</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400 border-2 border-stone-900"></span>
          <span>{photoLocations.length} photos</span>
        </div>
      </div>
    </div>
  );
}
