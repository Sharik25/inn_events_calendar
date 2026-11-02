import { normalizeDomain, siteConfig } from './lib/site';

describe('site config', () => {
  const repo = { owner: 'Sharik25', repo: 'world_of_warcraft_event_calendar' };

  it('serves GitHub Pages from the repo subpath while there is no custom domain', () => {
    expect(siteConfig(repo)).toEqual({
      basePath: '/world_of_warcraft_event_calendar/',
      siteUrl: 'https://sharik25.github.io/world_of_warcraft_event_calendar',
    });
    expect(siteConfig({ ...repo, customDomain: '  ' })).toEqual(siteConfig(repo));
  });

  it('serves a custom domain from its root', () => {
    expect(siteConfig({ ...repo, customDomain: 'almanac.example.com' })).toEqual({
      basePath: '/',
      siteUrl: 'https://almanac.example.com',
    });
    expect(normalizeDomain('https://Almanac.Example.com/')).toBe('almanac.example.com');
  });

  it('serves a <owner>.github.io user site from the root', () => {
    expect(siteConfig({ owner: 'Sharik25', repo: 'sharik25.github.io' })).toEqual({
      basePath: '/',
      siteUrl: 'https://sharik25.github.io',
    });
  });

  it('rejects anything that is not a hostname', () => {
    for (const bad of ['example', 'almanac.example.com/app', 'ftp://x.com', 'a b.com', '-x.com']) {
      expect(() => normalizeDomain(bad), bad).toThrow(/CUSTOM_DOMAIN/);
    }
  });
});
