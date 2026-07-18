// Real nearby clinics/hospitals from OpenStreetMap via the Overpass API.
// Fully free, no API key, and CORS-enabled so the browser can call it directly.

export type Clinic = {
  id: string;
  name: string;
  kind: string; // hospital | clinic | doctors
  specialty?: string;
  phone?: string;
  lat: number;
  lng: number;
  distanceKm: number;
};

export type GeoPoint = { lat: number; lng: number };

// Fallback so the feature still demos if location permission is denied.
export const DEFAULT_LOCATION = {
  lat: 12.9716,
  lng: 77.5946,
  label: "Bengaluru"
};

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

// Browser geolocation, wrapped as a promise.
export function getCurrentLocation(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { timeout: 8000 }
    );
  });
}

export async function fetchNearbyClinics(
  origin: GeoPoint,
  radiusMeters = 4000,
  limit = 12
): Promise<Clinic[]> {
  const query = `[out:json][timeout:25];
(
  node["amenity"~"doctors|clinic|hospital"](around:${radiusMeters},${origin.lat},${origin.lng});
  way["amenity"~"doctors|clinic|hospital"](around:${radiusMeters},${origin.lat},${origin.lng});
);
out center 60;`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`
  });
  if (!res.ok) throw new Error("Couldn't reach the map service.");

  const data = (await res.json()) as {
    elements: {
      id: number;
      type: string;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }[];
  };

  const clinics: Clinic[] = [];
  for (const el of data.elements) {
    const tags = el.tags;
    if (!tags?.name) continue;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat === undefined || lng === undefined) continue;

    clinics.push({
      id: `${el.type}-${el.id}`,
      name: tags.name,
      kind: tags.amenity ?? tags.healthcare ?? "clinic",
      specialty: tags["healthcare:speciality"]?.replace(/_/g, " "),
      phone: tags.phone ?? tags["contact:phone"],
      lat,
      lng,
      distanceKm: haversineKm(origin, { lat, lng })
    });
  }

  clinics.sort((a, b) => a.distanceKm - b.distanceKm);
  return clinics.slice(0, limit);
}

export function directionsUrl(clinic: Clinic): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`;
}
