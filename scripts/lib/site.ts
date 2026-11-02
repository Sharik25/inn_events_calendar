/**
 * Where the site is served from: the one place that decides the base path and absolute URL.
 *
 * - CUSTOM_DOMAIN set (e.g. "almanac.example.com"): served at that domain's root.
 * - Otherwise GitHub Pages' project URL: https://<owner>.github.io/<repo>/.
 */
export interface SiteConfig {
  /** Vite `base` / router basename: "/" or "/<repo>/". */
  basePath: string;
  /** Absolute app URL without trailing slash, for feed links and og:image. */
  siteUrl: string;
}

/** "https://Almanac.Example.com/" → "almanac.example.com"; throws on anything but a hostname. */
export function normalizeDomain(input: string): string {
  const host = input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
  if (!/^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(host)) {
    throw new Error(`CUSTOM_DOMAIN must be a hostname like "almanac.example.com", got "${input}"`);
  }
  return host;
}

export function siteConfig({
  customDomain,
  owner,
  repo,
}: {
  customDomain?: string;
  owner: string;
  repo: string;
}): SiteConfig {
  if (customDomain?.trim()) {
    return { basePath: '/', siteUrl: `https://${normalizeDomain(customDomain)}` };
  }
  // A "<owner>.github.io" repo is a user site, served at the root too.
  if (repo.toLowerCase() === `${owner.toLowerCase()}.github.io`) {
    return { basePath: '/', siteUrl: `https://${repo.toLowerCase()}` };
  }
  return { basePath: `/${repo}/`, siteUrl: `https://${owner.toLowerCase()}.github.io/${repo}` };
}
