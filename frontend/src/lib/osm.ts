// Real nearby clinics/hospitals from OpenStreetMap via the Overpass API,
// proxied through our own backend (see backend/src/routes/clinics.ts) —
// the public Overpass instance's usage policy and inconsistent CORS
// headers on error responses make it unreliable to call directly from
// the browser.

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

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:4000";

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
  const params = new URLSearchParams({
    lat: String(origin.lat),
    lng: String(origin.lng),
    radiusMeters: String(radiusMeters),
    limit: String(limit)
  });
  const res = await fetch(`${API_BASE}/api/clinics/nearby?${params}`);
  if (!res.ok) throw new Error("Couldn't reach the map service.");

  const data = (await res.json()) as { clinics: Clinic[] };
  return data.clinics;
}

export function directionsUrl(clinic: Clinic): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`;
}
