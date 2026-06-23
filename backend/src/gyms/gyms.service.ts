import { HttpException, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { GymEnrichmentService } from "./gym-enrichment.service";

const FSQ_BASE = "https://places-api.foursquare.com";
const FSQ_API_VERSION = "2025-02-05";
// Foursquare "Gym and Studio" category (covers gyms / fitness / studios).
const FSQ_GYM_CATEGORY = "4bf58dd8d48988d175941735";
// Free-tier fields only. rating / price / photos / hours are Foursquare
// "Premium" fields that consume API credits — request them only once billing
// is enabled (normalizePlace already maps them when present).
const FSQ_FIELDS = [
  "fsq_place_id",
  "name",
  "location",
  "latitude",
  "longitude",
  "distance",
  "categories",
  "tel",
  "website",
].join(",");

export interface GymResult {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  /** Straight-line distance in metres, when the search was point-based. */
  distanceMeters: number | null;
  category: string | null;
  /** Foursquare 0–10 rating, when present. */
  rating: number | null;
  /** Foursquare price tier 1–4, when present. */
  priceTier: number | null;
  tel: string | null;
  website: string | null;
  photoUrl: string | null;
}

export interface NearbyGymsResponse {
  configured: boolean;
  gyms: GymResult[];
}

interface FsqPhoto {
  prefix?: string;
  suffix?: string;
}
interface FsqCategory {
  name?: string;
}
interface FsqPlace {
  fsq_place_id?: string;
  fsq_id?: string;
  name?: string;
  location?: { formatted_address?: string; address?: string };
  latitude?: number;
  longitude?: number;
  geocodes?: { main?: { latitude?: number; longitude?: number } };
  distance?: number;
  categories?: FsqCategory[];
  tel?: string;
  website?: string;
  rating?: number;
  price?: number;
  photos?: FsqPhoto[];
}

export interface NearbyParams {
  ll?: string;
  near?: string;
  radius?: number;
  limit?: number;
}

export interface CompareGymInput {
  id: string;
  name: string;
  website?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  photoUrl?: string | null;
  distanceMeters?: number | null;
}

export interface GymComparison {
  id: string;
  name: string;
  address: string | null;
  website: string | null;
  rating: number | null;
  distanceMeters: number | null;
  pricePlans: { name: string; priceText: string; period: string | null }[];
  amenities: string[];
  /** Short least-crowded-times phrase, or null when unknown. */
  quietTimes: string | null;
  enrichedAt: string | null;
  /** True when at least one price plan was found. */
  priceAvailable: boolean;
}

export interface CompareResponse {
  /** False when server-side enrichment (Gemini) isn't configured. */
  enrichmentEnabled: boolean;
  gyms: GymComparison[];
}

// Re-crawl a gym at most this often.
const ENRICH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class GymsService {
  private readonly logger = new Logger(GymsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly enrichment: GymEnrichmentService,
  ) {}

  private get token(): string | undefined {
    return process.env.FOURSQUARE_SERVICE_TOKEN;
  }

  isConfigured(): boolean {
    return Boolean(this.token);
  }

  async nearby(params: NearbyParams): Promise<NearbyGymsResponse> {
    if (!this.token) {
      // Degrade gracefully so the frontend can show a friendly message.
      return { configured: false, gyms: [] };
    }

    const query = new URLSearchParams({
      fsq_category_ids: FSQ_GYM_CATEGORY,
      limit: String(params.limit ?? 50),
      fields: FSQ_FIELDS,
    });
    if (params.ll) {
      query.set("ll", params.ll);
      query.set("radius", String(params.radius ?? 8000));
      query.set("sort", "DISTANCE");
    } else if (params.near) {
      query.set("near", params.near);
    }

    let body: { results?: FsqPlace[] };
    try {
      const res = await fetch(`${FSQ_BASE}/places/search?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          "X-Places-Api-Version": FSQ_API_VERSION,
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        this.logger.warn(`Foursquare search failed: ${res.status}`);
        throw new HttpException("Gym search is unavailable right now.", 502);
      }
      body = (await res.json()) as { results?: FsqPlace[] };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error("Foursquare request error", error as Error);
      throw new HttpException("Gym search is unavailable right now.", 502);
    }

    return {
      configured: true,
      gyms: (body.results ?? []).map((p) => normalizePlace(p)),
    };
  }

  /**
   * Side-by-side comparison. Upserts each gym, enriches (Jina + Gemini) when the
   * cache is stale, persists the result, and returns price plans + amenities.
   * Enrichment is best-effort — a gym with no published prices still compares.
   */
  async compare(inputs: CompareGymInput[]): Promise<CompareResponse> {
    const gyms = await Promise.all(
      inputs.map((input) => this.compareOne(input)),
    );
    return { enrichmentEnabled: this.enrichment.isEnabled(), gyms };
  }

  private async compareOne(input: CompareGymInput): Promise<GymComparison> {
    const gym = await this.prisma.gym.upsert({
      where: { fsqPlaceId: input.id },
      create: {
        fsqPlaceId: input.id,
        name: input.name,
        address: input.address ?? null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        website: input.website ?? null,
        rating: input.rating ?? null,
        photoUrl: input.photoUrl ?? null,
      },
      update: {
        name: input.name,
        address: input.address ?? null,
        website: input.website ?? null,
        rating: input.rating ?? null,
        photoUrl: input.photoUrl ?? null,
      },
    });

    const stale =
      !gym.lastEnrichedAt ||
      Date.now() - gym.lastEnrichedAt.getTime() > ENRICH_TTL_MS;

    if (stale && this.enrichment.isEnabled()) {
      try {
        const { pricePlans, amenities, quietTimes } =
          await this.enrichment.enrich(gym.name, gym.address);
        await this.prisma.$transaction([
          this.prisma.gymPricePlan.deleteMany({
            where: { gymId: gym.id, source: "crawl" },
          }),
          this.prisma.gymAmenity.deleteMany({
            where: { gymId: gym.id, source: "crawl" },
          }),
          ...(pricePlans.length > 0
            ? [
                this.prisma.gymPricePlan.createMany({
                  data: pricePlans.map((p) => ({
                    gymId: gym.id,
                    name: p.name,
                    priceText: p.priceText,
                    period: p.period,
                    source: "crawl" as const,
                  })),
                }),
              ]
            : []),
          ...(amenities.length > 0
            ? [
                this.prisma.gymAmenity.createMany({
                  data: amenities.map((name) => ({
                    gymId: gym.id,
                    name,
                    source: "crawl" as const,
                  })),
                  skipDuplicates: true,
                }),
              ]
            : []),
          // Mark enriched even when empty, so we cache the "nothing found".
          this.prisma.gym.update({
            where: { id: gym.id },
            data: { lastEnrichedAt: new Date(), quietTimes },
          }),
        ]);
      } catch (error) {
        this.logger.warn(`Enrichment failed for ${gym.name}: ${String(error)}`);
      }
    }

    const full = await this.prisma.gym.findUnique({
      where: { id: gym.id },
      include: {
        pricePlans: { orderBy: { createdAt: "asc" } },
        amenities: { orderBy: { name: "asc" } },
      },
    });

    return {
      id: gym.fsqPlaceId,
      name: gym.name,
      address: gym.address,
      website: gym.website,
      rating: gym.rating,
      distanceMeters: input.distanceMeters ?? null,
      pricePlans: (full?.pricePlans ?? []).map((p) => ({
        name: p.name,
        priceText: p.priceText,
        period: p.period,
      })),
      amenities: (full?.amenities ?? []).map((a) => a.name),
      quietTimes: full?.quietTimes ?? null,
      enrichedAt: full?.lastEnrichedAt?.toISOString() ?? null,
      priceAvailable: (full?.pricePlans?.length ?? 0) > 0,
    };
  }
}

function normalizePlace(p: FsqPlace): GymResult {
  const photo = p.photos?.[0];
  const photoUrl =
    photo?.prefix && photo?.suffix
      ? `${photo.prefix}original${photo.suffix}`
      : null;

  return {
    id: p.fsq_place_id ?? p.fsq_id ?? "",
    name: p.name ?? "Unknown gym",
    address: p.location?.formatted_address ?? p.location?.address ?? null,
    latitude: p.latitude ?? p.geocodes?.main?.latitude ?? null,
    longitude: p.longitude ?? p.geocodes?.main?.longitude ?? null,
    distanceMeters: typeof p.distance === "number" ? p.distance : null,
    category: p.categories?.[0]?.name ?? null,
    rating: typeof p.rating === "number" ? p.rating : null,
    priceTier: typeof p.price === "number" ? p.price : null,
    tel: p.tel ?? null,
    website: p.website ?? null,
    photoUrl,
  };
}

export { normalizePlace };
