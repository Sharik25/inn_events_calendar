/**
 * Prints BASE_PATH and SITE_URL for the deploy, as KEY=value lines for $GITHUB_ENV:
 *   npx tsx scripts/site-env.ts >> "$GITHUB_ENV"
 * Reads CUSTOM_DOMAIN (repo variable, optional) and GITHUB_REPOSITORY ("owner/repo").
 */
import { siteConfig } from './lib/site';

const [owner = '', repo = ''] = (process.env.GITHUB_REPOSITORY ?? '').split('/');
if (!owner || !repo) {
  console.error('GITHUB_REPOSITORY must be "owner/repo"');
  process.exit(1);
}

const { basePath, siteUrl } = siteConfig({ customDomain: process.env.CUSTOM_DOMAIN, owner, repo });
console.log(`BASE_PATH=${basePath}`);
console.log(`SITE_URL=${siteUrl}`);
