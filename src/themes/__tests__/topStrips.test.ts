import { loadTheme, themeIds, topStripOf } from '..';
import { topStripHeight } from '@/ui/ThemeDecorations/sizes';

describe.each(themeIds)('theme "%s"', (id) => {
  it('lists its top strip height in the registry, matching its decorations', async () => {
    const theme = await loadTheme(id);
    expect(topStripOf(id)).toEqual(topStripHeight(theme.decorations));
  });
});
