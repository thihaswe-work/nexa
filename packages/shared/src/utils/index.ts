import type { GeoPoint, GeoBounds } from '../types';

export function calculateDistance(a: GeoPoint, b: GeoPoint): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);

  return 2 * R * Math.asin(Math.sqrt(h));
}

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function generateGeoBounds(
  center: GeoPoint,
  radiusKm: number,
): GeoBounds {
  const latChange = (radiusKm / 6371) * (180 / Math.PI);
  const lonChange =
    ((radiusKm / 6371) * (180 / Math.PI)) /
    Math.cos((center.latitude * Math.PI) / 180);

  return {
    north: center.latitude + latChange,
    south: center.latitude - latChange,
    east: center.longitude + lonChange,
    west: center.longitude - lonChange,
  };
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '...';
}

export function generateId(length = 24): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function excludeFields<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}
