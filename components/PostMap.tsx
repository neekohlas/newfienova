'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Get base path for assets (empty in dev, '/newfienova' in prod)
const basePath = process.env.NODE_ENV === 'production' ? '/newfienova' : '';

interface ImageMatch {
  geotaggedFile: string;
  geotaggedPath: string;
  similarity: number;
  path: string;
  latitude: number;
  longitude: number;
  date: string;
}

interface ImageMatches {
  [mediaPath: string]: ImageMatch;
}

interface PostMapProps {
  postId: string;
  postImages: string[];
  imageMatches: ImageMatches;
}

interface MapContentProps {
  postId: string;
  matchedImages: { imagePath: string; match: ImageMatch }[];
  bounds: {
    center: { lat: number; lng: number };
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoom: number;
  isExpanded: boolean;
  isChronological: boolean;
}

// Component to fit map bounds after mount
function FitBounds({ bounds, isExpanded }: { bounds: { north: number; south: number; east: number; west: number }, isExpanded: boolean }) {
  const { useMap } = require('react-leaflet');
  const map = useMap();

  useEffect(() => {
    // Add padding to show provincial context
    const padding = isExpanded ? 0.15 : 0.25;
    const latPadding = Math.max(0.1, (bounds.north - bounds.south) * padding);
    const lngPadding = Math.max(0.1, (bounds.east - bounds.west) * padding);

    const paddedBounds = [
      [bounds.south - latPadding, bounds.west - lngPadding],
      [bounds.north + latPadding, bounds.east + lngPadding]
    ];

    map.fitBounds(paddedBounds, {
      animate: false,
      maxZoom: 13,
      padding: [20, 20]
    });
  }, [map, bounds, isExpanded]);

  return null;
}

// Create the map content component that will be dynamically imported
function MapContentComponent({
  postId,
  matchedImages,
  bounds,
  zoom,
  isExpanded,
  isChronological,
}: MapContentProps) {
  const { MapContainer, TileLayer, Polyline, Marker, Popup } = require('react-leaflet');
  const L = require('leaflet');

  const routeLatLngs = matchedImages.map(({ match }) => [match.latitude, match.longitude] as [number, number]);

  return (
    <MapContainer
      key={`map-${postId}-${isExpanded}`}
      center={[bounds.center.lat, bounds.center.lng]}
      zoom={8}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={isExpanded}
      dragging={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Fit bounds to show all pins with context */}
      <FitBounds bounds={bounds} isExpanded={isExpanded} />

      {/* Route line - only show for chronological posts */}
      {isChronological && routeLatLngs.length > 1 && (
        <Polyline
          positions={routeLatLngs}
          pathOptions={{
            color: '#1c1917',
            weight: 2,
            opacity: 0.5,
            dashArray: '6, 6',
          }}
        />
      )}

      {/* Photo thumbnail markers */}
      {matchedImages.map(({ imagePath, match }, idx) => {
        const thumbnailIcon = L.divIcon({
          className: 'thumbnail-marker',
          html: `
            <div style="
              width: 44px;
              height: 44px;
              border-radius: 6px;
              border: 3px solid #1c1917;
              overflow: hidden;
              box-shadow: 0 2px 8px rgba(0,0,0,0.4);
              background: white;
            ">
              <img
                src="${basePath}${imagePath}"
                alt="Photo"
                style="width: 100%; height: 100%; object-fit: cover;"
              />
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -22],
        });

        return (
          <Marker
            key={`thumb-${postId}-${idx}`}
            position={[match.latitude, match.longitude]}
            icon={thumbnailIcon}
          >
            <Popup>
              <div className="text-sm">
                <img
                  src={`${basePath}${imagePath}`}
                  alt="Photo from post"
                  className="max-w-[220px] rounded mb-2"
                />
                {match.date && (
                  <p className="text-stone-500 text-xs">
                    {match.date.replace(/:/g, '-').replace(' ', ' at ')}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

// Dynamically import the map content with no SSR
const MapContent = dynamic(() => Promise.resolve(MapContentComponent), {
  ssr: false,
  loading: () => (
    <div className="bg-stone-100 rounded-lg flex items-center justify-center h-full">
      <p className="text-stone-400 text-sm">Loading map...</p>
    </div>
  ),
});

export default function PostMap({ postId, postImages, imageMatches }: PostMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Find matched images for this post
  const matchedImages = useMemo(() => {
    const matched: { imagePath: string; match: ImageMatch }[] = [];

    for (const img of postImages) {
      const match = imageMatches[img];
      // Only include matches that have valid coordinates
      if (match && typeof match.latitude === 'number' && typeof match.longitude === 'number') {
        matched.push({ imagePath: img, match });
      }
    }

    // Sort by date (handle undefined dates)
    matched.sort((a, b) => {
      const dateA = a.match?.date || '';
      const dateB = b.match?.date || '';
      return dateA.localeCompare(dateB);
    });
    return matched;
  }, [postImages, imageMatches]);

  // Calculate bounds
  const bounds = useMemo(() => {
    if (matchedImages.length === 0) return null;

    let north = -90, south = 90, east = -180, west = 180;

    matchedImages.forEach(({ match }) => {
      if (match.latitude > north) north = match.latitude;
      if (match.latitude < south) south = match.latitude;
      if (match.longitude > east) east = match.longitude;
      if (match.longitude < west) west = match.longitude;
    });

    const latPadding = Math.max(0.05, (north - south) * 0.3);
    const lngPadding = Math.max(0.05, (east - west) * 0.3);

    return {
      center: {
        lat: (north + south) / 2,
        lng: (east + west) / 2
      },
      north: north + latPadding,
      south: south - latPadding,
      east: east + lngPadding,
      west: west - lngPadding
    };
  }, [matchedImages]);

  // Check if this is a "thematic" post (photos span many days, not chronological)
  const isChronological = useMemo(() => {
    if (matchedImages.length < 2) return true;

    const dates = matchedImages
      .map(({ match }) => match.date)
      .filter(d => d)
      .map(d => d.split(' ')[0]);

    if (dates.length < 2) return true;

    const uniqueDates = [...new Set(dates)].sort();
    const firstDate = new Date(uniqueDates[0].replace(/:/g, '-'));
    const lastDate = new Date(uniqueDates[uniqueDates.length - 1].replace(/:/g, '-'));
    const daySpan = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

    return daySpan <= 3;
  }, [matchedImages]);

  // Don't render if no matched images
  if (matchedImages.length === 0) {
    return null;
  }

  if (!isMounted || !bounds) {
    return (
      <div className="bg-stone-100 rounded-lg flex items-center justify-center h-48 mb-8">
        <p className="text-stone-400 text-sm">Loading map...</p>
      </div>
    );
  }

  // Calculate zoom
  const latDiff = bounds.north - bounds.south;
  const lngDiff = bounds.east - bounds.west;
  const maxDiff = Math.max(latDiff, lngDiff);
  let zoom = 11;
  if (maxDiff > 3) zoom = 6;
  else if (maxDiff > 2) zoom = 7;
  else if (maxDiff > 1) zoom = 8;
  else if (maxDiff > 0.5) zoom = 9;
  else if (maxDiff > 0.2) zoom = 10;
  else if (maxDiff < 0.05) zoom = 13;

  const mapHeight = isExpanded ? 'h-[400px] md:h-[500px]' : 'h-48 md:h-56';

  return (
    <div className="mb-8 rounded-lg overflow-hidden shadow-md relative z-0">
      <div className={`${mapHeight} transition-all duration-300`}>
        <MapContent
          postId={postId}
          matchedImages={matchedImages}
          bounds={bounds}
          zoom={zoom}
          isExpanded={isExpanded}
          isChronological={isChronological}
        />
      </div>

      {/* Footer */}
      <div className="bg-stone-100 px-3 py-2 text-xs text-stone-500 flex items-center justify-between">
        <span>{matchedImages.length} photo{matchedImages.length !== 1 ? 's' : ''} with locations</span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-stone-600 hover:text-stone-900 font-medium flex items-center gap-1 transition-colors"
        >
          {isExpanded ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              Collapse
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Expand map
            </>
          )}
        </button>
      </div>
    </div>
  );
}
