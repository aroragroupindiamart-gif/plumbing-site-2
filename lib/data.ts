import locationsRaw from "./data/locations.json";
import servicesRaw from "./data/services.json";

export interface Service {
  id: number;
  service_name: string;
  service_slug: string;
  service_tier: number;
  base_keywords: string[];
}

export interface Location {
  id: number;
  state_code: string;
  state_name: string;
  county_name: string;
  place_name: string;
  place_slug: string;
  place_type: string;
  population: number;
  area_code: string;
  tier: number;
}

export interface StateRow {
  state_code: string;
  state_name: string;
  location_count: number;
  page_count: number;
}

const ALL_LOCATIONS = locationsRaw as unknown as Location[];
const ALL_SERVICES  = servicesRaw  as unknown as Service[];

const locationByKey = new Map<string, Location>();
const locationById  = new Map<number, Location>();
const serviceBySlug = new Map<string, Service>();

for (const loc of ALL_LOCATIONS) {
  locationByKey.set(`${loc.state_code}|${loc.place_slug}`, loc);
  locationById.set(loc.id, loc);
}
for (const svc of ALL_SERVICES) {
  serviceBySlug.set(svc.service_slug, svc);
}

function shuffleKey(serviceId: number, locationId: number): number {
  let h = Math.imul(serviceId, 2654435761) ^ Math.imul(locationId, 2246822519);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  h = Math.imul(h ^ (h >>> 16), 0x45d9f3b);
  return (h ^ (h >>> 16)) >>> 0;
}

export async function getAllLocations(): Promise<Location[]> {
  return ALL_LOCATIONS;
}

export async function getAllServices(): Promise<Service[]> {
  return ALL_SERVICES;
}

export async function getStates(): Promise<StateRow[]> {
  const map = new Map<string, StateRow>();
  for (const loc of ALL_LOCATIONS) {
    const entry = map.get(loc.state_code);
    const pages = loc.tier === 1 ? ALL_SERVICES.length : loc.tier === 2 ? Math.ceil(ALL_SERVICES.length * 0.5) : Math.ceil(ALL_SERVICES.length * 0.17);
    if (entry) {
      entry.location_count++;
      entry.page_count += pages;
    } else {
      map.set(loc.state_code, {
        state_code: loc.state_code,
        state_name: loc.state_name,
        location_count: 1,
        page_count: pages,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.state_name.localeCompare(b.state_name)
  );
}

export async function getStateByCode(stateCode: string): Promise<StateRow | null> {
  const states = await getStates();
  return states.find((s) => s.state_code === stateCode) ?? null;
}

export async function getLocationsByState(stateCode: string): Promise<Location[]> {
  return ALL_LOCATIONS.filter((l) => l.state_code === stateCode).sort(
    (a, b) => b.population - a.population || a.place_name.localeCompare(b.place_name)
  );
}

export async function getLocation(stateCode: string, placeSlug: string): Promise<Location | null> {
  return locationByKey.get(`${stateCode}|${placeSlug}`) ?? null;
}

export async function getLocationById(id: number): Promise<Location | null> {
  return locationById.get(id) ?? null;
}

export async function getService(serviceSlug: string): Promise<Service | null> {
  return serviceBySlug.get(serviceSlug) ?? null;
}

export async function getServicesByLocationTier(tier: number): Promise<Service[]> {
  const total = ALL_SERVICES.length;
  const limit = tier === 1 ? total : tier === 2 ? Math.ceil(total * 0.5) : Math.ceil(total * 0.17);
  return ALL_SERVICES.slice(0, limit);
}

export async function getServicesByLocation(locationId: number): Promise<Service[]> {
  const loc = locationById.get(locationId);
  if (!loc) return [];
  const total = ALL_SERVICES.length;
  const tierLimit = loc.tier === 1 ? total : loc.tier === 2 ? Math.ceil(total * 0.5) : Math.ceil(total * 0.17);
  if (loc.tier === 2 || loc.tier === 3) {
    return ALL_SERVICES.slice(0, tierLimit)
      .slice()
      .sort((a, b) => shuffleKey(a.id, locationId) - shuffleKey(b.id, locationId));
  }
  return getServicesByLocationTier(loc.tier);
}

export async function isServiceAllowedForTier(serviceId: number, locationTier: number): Promise<boolean> {
  const total = ALL_SERVICES.length;
  const limit = locationTier === 1 ? total : locationTier === 2 ? Math.ceil(total * 0.5) : Math.ceil(total * 0.17);
  return ALL_SERVICES.slice(0, limit).some((s) => s.id === serviceId);
}

export async function getSiblingServices(locationId: number, serviceId: number, limit = 5): Promise<Service[]> {
  const loc = locationById.get(locationId);
  if (!loc) return [];
  const total = ALL_SERVICES.length;
  const tierLimit = loc.tier === 1 ? total : loc.tier === 2 ? Math.ceil(total * 0.5) : Math.ceil(total * 0.17);
  const pool = ALL_SERVICES.slice(0, tierLimit).filter((s) => s.id !== serviceId);
  if (loc.tier === 2 || loc.tier === 3) {
    return pool
      .slice()
      .sort((a, b) => shuffleKey(a.id, locationId) - shuffleKey(b.id, locationId))
      .slice(0, limit);
  }
  return pool.slice(0, limit);
}

export async function getNearbyLocations(locationId: number, stateCode: string, limit = 3): Promise<Location[]> {
  return ALL_LOCATIONS.filter(
    (l) => l.state_code === stateCode && l.id !== locationId
  )
    .sort((a, b) => b.population - a.population)
    .slice(0, limit);
}
