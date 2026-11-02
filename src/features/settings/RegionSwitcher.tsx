import type { VersionConfig } from '@/domain/types';
import { useRegionId, useSettings } from '@/state/settings';
import { strings } from '@/strings';
import { Segmented } from '@/ui';

/** Which region's server time a version's events follow. Hidden for single-region versions. */
export function RegionSwitcher({ version }: { version: VersionConfig }) {
  const regionId = useRegionId(version);
  const setRegion = useSettings((s) => s.setRegion);
  if (version.regions.length < 2) return null;

  return (
    <Segmented
      legend={strings.settings.region}
      options={version.regions.map((r) => ({ value: r.id, label: r.label }))}
      value={regionId}
      onChange={(id) => setRegion(version.id, id)}
    />
  );
}
