import { createBrowserRouter, type RouteObject } from 'react-router';
import { MonthView } from '@/features/month/MonthView';
import { TodayView } from '@/features/today/TodayView';
import { WeekView } from '@/features/week/WeekView';
import { ROUTER_BASENAME } from '@/lib/base';
import type { ViewMode } from './paths';
import {
  dayLoader,
  monthLoader,
  rootLoader,
  versionIndexLoader,
  versionlessLoader,
  versionLoader,
  weekLoader,
} from './routes/loaders';
import { NotFound } from './routes/NotFound';
import { VersionLayout } from './routes/VersionLayout';

const hydrateFallback = () => null;
const view = (mode: ViewMode) => ({ view: mode });

export const routes: RouteObject[] = [
  { path: '/', loader: rootLoader, HydrateFallback: hydrateFallback },
  // Links without a version open the start version (static segments outrank `/:versionId`).
  { path: '/today', loader: versionlessLoader('today'), HydrateFallback: hydrateFallback },
  ...(['day', 'week', 'month'] as const).flatMap((view) => [
    { path: `/${view}`, loader: versionlessLoader(view), HydrateFallback: hydrateFallback },
    { path: `/${view}/*`, loader: versionlessLoader(view), HydrateFallback: hydrateFallback },
  ]),
  {
    // Hidden design-system gallery (PLAN.md Phase 2). Lazy so it never weighs on the main bundle.
    path: '/dev/ui',
    lazy: async () => ({ Component: (await import('./dev/UiGallery')).UiGallery }),
    HydrateFallback: hydrateFallback,
  },
  {
    id: 'version',
    path: '/:versionId',
    loader: versionLoader,
    Component: VersionLayout,
    ErrorBoundary: NotFound,
    HydrateFallback: hydrateFallback,
    children: [
      { index: true, loader: versionIndexLoader },
      { path: 'today', Component: TodayView, handle: view('day') },
      { path: 'day/:date', loader: dayLoader, Component: TodayView, handle: view('day') },
      { path: 'week', loader: weekLoader },
      { path: 'week/:date', loader: weekLoader, Component: WeekView, handle: view('week') },
      { path: 'month', loader: monthLoader },
      { path: 'month/:month', loader: monthLoader, Component: MonthView, handle: view('month') },
    ],
  },
  { path: '*', Component: NotFound },
];

export const router = createBrowserRouter(routes, { basename: ROUTER_BASENAME });
