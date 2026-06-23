import { apiFetch } from "@/lib/api/client";
import type {
  CompareResult,
  Coords,
  Gym,
  NearbyGymsResult,
} from "@/lib/gymFinder";

export function fetchGymsByCoords(
  coords: Coords,
  radiusMeters?: number,
): Promise<NearbyGymsResult> {
  const params = new URLSearchParams({
    ll: `${coords.latitude},${coords.longitude}`,
  });
  if (radiusMeters) {
    params.set("radius", String(radiusMeters));
  }
  return apiFetch<NearbyGymsResult>(`/gyms/nearby?${params.toString()}`);
}

export function fetchGymsByPlace(near: string): Promise<NearbyGymsResult> {
  const params = new URLSearchParams({ near });
  return apiFetch<NearbyGymsResult>(`/gyms/nearby?${params.toString()}`);
}

export function compareGyms(gyms: Gym[]): Promise<CompareResult> {
  return apiFetch<CompareResult>("/gyms/compare", {
    method: "POST",
    body: {
      gyms: gyms.map((g) => ({
        id: g.id,
        name: g.name,
        website: g.website,
        address: g.address,
        latitude: g.latitude,
        longitude: g.longitude,
        rating: g.rating,
        photoUrl: g.photoUrl,
        distanceMeters: g.distanceMeters,
      })),
    },
  });
}
