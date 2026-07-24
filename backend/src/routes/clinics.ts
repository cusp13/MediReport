import type { FastifyInstance } from "fastify";

// Proxies Overpass (OpenStreetMap) queries server-side. The public Overpass
// instance enforces a usage policy (descriptive User-Agent, form-encoded
// body) that browsers can't fully satisfy directly — fetch() can't set
// User-Agent, and cross-origin error responses from overpass-api.de often
// omit CORS headers, which surfaces to users as an opaque "CORS" failure
// even though the real cause is the request being rejected. Calling it from
// the backend sidesteps both problems.
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

type OverpassElement = {
  id: number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

export async function clinicRoutes(app: FastifyInstance) {
  app.get(
    "/api/clinics/nearby",
    {
      schema: {
        querystring: {
          type: "object",
          properties: {
            lat: { type: "number" },
            lng: { type: "number" },
            radiusMeters: { type: "number" },
            limit: { type: "number" }
          },
          required: ["lat", "lng"]
        }
      }
    },
    async (request, reply) => {
      const query = request.query as {
        lat: number;
        lng: number;
        radiusMeters?: number;
        limit?: number;
      };
      const radiusMeters = Math.min(query.radiusMeters ?? 4000, 20000);
      const limit = Math.min(query.limit ?? 12, 30);
      const origin = { lat: query.lat, lng: query.lng };

      const overpassQuery = `[out:json][timeout:25];
(
  node["amenity"~"doctors|clinic|hospital"](around:${radiusMeters},${origin.lat},${origin.lng});
  way["amenity"~"doctors|clinic|hospital"](around:${radiusMeters},${origin.lat},${origin.lng});
);
out center 60;`;

      let elements: OverpassElement[];
      try {
        const res = await fetch(OVERPASS_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            // Overpass's usage policy asks for a descriptive User-Agent so
            // requests aren't mistaken for abusive/anonymous traffic.
            "User-Agent": "MediReportAI/1.0 (https://medi-report-one.vercel.app)"
          },
          body: `data=${encodeURIComponent(overpassQuery)}`
        });
        if (!res.ok) throw new Error(`Overpass returned ${res.status}`);
        const data = (await res.json()) as { elements: OverpassElement[] };
        elements = data.elements;
      } catch (err) {
        app.log.warn({ err }, "Overpass lookup failed");
        return reply.code(502).send({ error: "Couldn't reach the map service." });
      }

      const clinics = [];
      for (const el of elements) {
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
      return { clinics: clinics.slice(0, limit) };
    }
  );
}
