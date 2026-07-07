export function selectVariant(variants: string[], locationId: number, serviceId: number): string {
  if (!variants || variants.length === 0) return "";
  const hash = Math.abs((locationId * 31 + serviceId) % variants.length);
  return variants[hash];
}
