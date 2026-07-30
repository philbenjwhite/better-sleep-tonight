// Hosts that are allowed to be indexed by search engines and to fire the
// client's production analytics. Everything else (preview deployments, the
// project's *.vercel.app aliases, localhost) is treated as non-public: it gets
// an X-Robots-Tag: noindex header from middleware and loads no tracking.
//
// Host-based rather than env-based on purpose. The production .vercel.app alias
// is served by the same build as the custom domain, so a build-time check such
// as VERCEL_ENV cannot tell them apart.
export const PRODUCTION_HOSTS = [
  "www.bettersleeptonight.com",
  "bettersleeptonight.com",
] as const;

export function isProductionHost(host: string | null | undefined): boolean {
  if (!host) return false;
  // Strip any port, normalise case.
  const hostname = host.split(":")[0].toLowerCase();
  return (PRODUCTION_HOSTS as readonly string[]).includes(hostname);
}
