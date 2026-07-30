'use client';

import { useMemo } from 'react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { Skeleton } from '@/components/ui/skeleton';

const MAP_ID = 'nexa-admin-map';
const containerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 40.7128, lng: -74.006 };

interface LocationPoint {
  lat: number;
  lng: number;
  label?: string;
}

interface GoogleMapsMapProps {
  locations: LocationPoint[];
}

export default function GoogleMapsMap({ locations }: GoogleMapsMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: MAP_ID,
    googleMapsApiKey: apiKey || '',
  });

  const center = useMemo(() => {
    if (locations.length === 0) return defaultCenter;
    const avgLat = locations.reduce((s, l) => s + l.lat, 0) / locations.length;
    const avgLng = locations.reduce((s, l) => s + l.lng, 0) / locations.length;
    return { lat: avgLat, lng: avgLng };
  }, [locations]);

  if (!apiKey) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border bg-muted/20">
        <div className="text-center max-w-md px-4">
          <p className="text-sm text-muted-foreground">
            Google Maps API key not configured.
          </p>
          <p className="mt-2 text-xs text-muted-foreground/60">
            Set <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_GOOGLE_MAPS_KEY</code> in your environment variables.
          </p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border bg-muted/20">
        <p className="text-sm text-destructive">Failed to load Google Maps. Check your API key.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return <Skeleton className="h-full w-full rounded-lg" />;
  }

  if (locations.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-lg border bg-muted/20">
        <p className="text-sm text-muted-foreground">No location data to display on the map.</p>
      </div>
    );
  }

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={10}>
      {locations.map((loc, i) => (
        <Marker
          key={`${loc.lat}-${loc.lng}-${i}`}
          position={{ lat: loc.lat, lng: loc.lng }}
          title={loc.label}
        />
      ))}
    </GoogleMap>
  );
}
