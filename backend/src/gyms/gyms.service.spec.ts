import { normalizePlace } from "./gyms.service";

describe("normalizePlace", () => {
  it("maps a full Foursquare place", () => {
    const gym = normalizePlace({
      fsq_place_id: "abc",
      name: "Iron Temple",
      location: { formatted_address: "1 Main St, Austin, TX", country: "US" },
      latitude: 30.27,
      longitude: -97.74,
      distance: 540,
      categories: [{ name: "Gym / Fitness" }],
      tel: "+1 555-1234",
      website: "https://iron.example",
      rating: 9.1,
      price: 2,
      photos: [{ prefix: "https://fsq.example/", suffix: "/photo.jpg" }],
    });

    expect(gym).toEqual({
      id: "abc",
      name: "Iron Temple",
      address: "1 Main St, Austin, TX",
      country: "US",
      latitude: 30.27,
      longitude: -97.74,
      distanceMeters: 540,
      category: "Gym / Fitness",
      rating: 9.1,
      priceTier: 2,
      tel: "+1 555-1234",
      website: "https://iron.example",
      photoUrl: "https://fsq.example/original/photo.jpg",
    });
  });

  it("falls back to legacy id, geocodes, and nullable fields", () => {
    const gym = normalizePlace({
      fsq_id: "legacy",
      name: "Bare Gym",
      geocodes: { main: { latitude: 40.7, longitude: -74 } },
    });

    expect(gym.id).toBe("legacy");
    expect(gym.latitude).toBe(40.7);
    expect(gym.longitude).toBe(-74);
    expect(gym.distanceMeters).toBeNull();
    expect(gym.rating).toBeNull();
    expect(gym.priceTier).toBeNull();
    expect(gym.address).toBeNull();
    expect(gym.photoUrl).toBeNull();
  });

  it("uses a safe default name when missing", () => {
    expect(normalizePlace({}).name).toBe("Unknown gym");
  });
});
