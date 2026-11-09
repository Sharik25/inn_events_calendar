# Moving to a custom domain

The app has no hardcoded host or path. Where it is served is decided by one setting,
the GitHub repository variable `CUSTOM_DOMAIN`, read at build time by
`scripts/lib/site.ts`:

| `CUSTOM_DOMAIN`       | Served at                                                      |
| --------------------- | -------------------------------------------------------------- |
| not set (today)       | `https://sharik25.github.io/world_of_warcraft_event_calendar/` |
| `almanac.example.com` | `https://almanac.example.com/`                                 |

From it the deploy derives `BASE_PATH` (Vite `base`, router basename, asset, icon and
feed paths) and `SITE_URL` (links in `.ics` feeds, `og:image`).

## When you have the domain

1. **DNS** (at your registrar), per [GitHub's guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site):
   - apex domain (`example.com`): `A` records to `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153` (and the `AAAA` ones from the guide);
   - subdomain (`almanac.example.com`): `CNAME` to `sharik25.github.io`.
2. **GitHub → Settings → Pages → Custom domain**: enter the domain, save, wait for the
   DNS check, then tick **Enforce HTTPS**. (Verifying the domain under your account's
   Pages settings first protects it from takeover.)
3. **GitHub → Settings → Secrets and variables → Actions → Variables**: add
   `CUSTOM_DOMAIN` = the same domain, without `https://` or a path.
4. **Re-run** the "Deploy to GitHub Pages" workflow (Actions tab → Run workflow).

No `CNAME` file is needed: Pages ignores it for workflow deployments.

## After the switch

- Old `github.io/world_of_warcraft_event_calendar/...` links redirect to the new domain.
- Calendar subscriptions keep working through that redirect, but tell subscribers the
  new feed address (Settings → Subscribe) so they don't depend on it.
- The installed PWA and saved settings belong to the old origin: visitors start fresh
  once (default language, Forever).

To go back, delete the `CUSTOM_DOMAIN` variable, remove the domain under Settings → Pages,
and re-run the deploy.
