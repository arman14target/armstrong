export interface Gym {
  id: string;
  name: string;
  address: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  category: string | null;
  rating: number | null;
  priceTier: number | null;
  tel: string | null;
  website: string | null;
  photoUrl: string | null;
}

export interface NearbyGymsResult {
  configured: boolean;
  gyms: Gym[];
}

export interface GymPricePlan {
  name: string;
  priceText: string;
  period: string | null;
}

export interface GymComparison {
  id: string;
  name: string;
  address: string | null;
  website: string | null;
  rating: number | null;
  distanceMeters: number | null;
  pricePlans: GymPricePlan[];
  amenities: string[];
  quietTimes: string | null;
  enrichedAt: string | null;
  priceAvailable: boolean;
}

export interface CompareResult {
  enrichmentEnabled: boolean;
  gyms: GymComparison[];
}

export type DistanceUnit = "km" | "mi";

const METERS_PER_MILE = 1609.344;

/** Miles for US locales, kilometres elsewhere. */
export function localeDistanceUnit(): DistanceUnit {
  if (typeof navigator === "undefined") {
    return "km";
  }
  return /-US$/i.test(navigator.language || "") ? "mi" : "km";
}

/** e.g. `850 m`, `1.2 km`, or `0.8 mi`. */
export function formatDistance(
  meters: number | null,
  unit: DistanceUnit,
): string | null {
  if (meters === null || !Number.isFinite(meters)) {
    return null;
  }
  if (unit === "mi") {
    const mi = meters / METERS_PER_MILE;
    return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
  }
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** Foursquare price tier (1–4) → `$`–`$$$$`, or null. */
export function formatPriceTier(tier: number | null): string | null {
  if (!tier || tier < 1) {
    return null;
  }
  return "$".repeat(Math.min(4, tier));
}

/** A Google Maps directions/search link for a gym. */
export function mapsLink(gym: Gym): string {
  if (gym.latitude !== null && gym.longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${gym.latitude},${gym.longitude}`;
  }
  const q = encodeURIComponent([gym.name, gym.address].filter(Boolean).join(" "));
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export interface Coords {
  latitude: number;
  longitude: number;
}

export function isGeolocationAvailable(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

/** Promise wrapper over the browser Geolocation API. */
export function getCurrentCoords(): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationAvailable()) {
      reject(new Error("Location is not available on this device."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  });
}
