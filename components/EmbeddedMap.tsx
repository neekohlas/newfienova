'use client';

import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface EmbeddedMapProps {
  center: [number, number];
  zoom: number;
  title: string;
}

export default function EmbeddedMap({ center, zoom }: EmbeddedMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: '400px', width: '100%', borderRadius: '8px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
    </MapContainer>
  );
}
