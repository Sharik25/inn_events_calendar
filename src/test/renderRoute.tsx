import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { Providers } from '@/app/providers';
import { routes } from '@/app/router';
import { defaultSettings, useSettings, type Settings } from '@/state/settings';

/** Renders the real route tree at `path`. Resets persisted settings first, then applies `settings`. */
export function renderRoute(path: string, settings: Partial<Settings> = {}) {
  localStorage.clear();
  useSettings.setState({ ...defaultSettings(), ...settings });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return {
    router,
    ...render(
      <Providers>
        <RouterProvider router={router} />
      </Providers>,
    ),
  };
}
