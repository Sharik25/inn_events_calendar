import { redirect, type LoaderFunctionArgs } from 'react-router';
import { bundledRepository } from '@/data/repository';
import { defaultVersionId } from '@/data/versions';
import type { EventCatalog, VersionConfig } from '@/domain/types';
import { startOfWeek } from '@/engine/calendar';
import { addDays, localDateOf } from '@/engine/time';
import { userTimeZone, useSettings } from '@/state/settings';
import { paths } from '../paths';

const repository = bundledRepository;

export interface VersionLoaderData {
  version: VersionConfig;
  versions: VersionConfig[];
  catalog: EventCatalog;
}

/** The version a link without one opens: the one picked in the switcher, else the default. */
async function startVersionId(): Promise<string> {
  const versions = await repository.getVersions();
  const chosen = useSettings.getState().chosenVersionId;
  return chosen && versions.some((v) => v.id === chosen) ? chosen : defaultVersionId;
}

/** `/` → Today of the start version (WoW: Forever unless the user picked another). */
export async function rootLoader() {
  return redirect(paths.today(await startVersionId()));
}

/**
 * A view URL without a version (`/today`, `/day/…`, `/week/…`, `/month/…`) → the same view and
 * query in the start version, e.g. `/month/2026-11` → `/forever/month/2026-11`.
 */
export function versionlessLoader(view: 'today' | 'day' | 'week' | 'month') {
  return async ({ request, params }: LoaderFunctionArgs) => {
    const rest = params['*'] ? `/${params['*']}` : '';
    const { search } = new URL(request.url);
    return redirect(`/${await startVersionId()}/${view}${rest}${search}`);
  };
}

export async function versionLoader({ params }: LoaderFunctionArgs): Promise<VersionLoaderData> {
  const version = params.versionId ? await repository.getVersion(params.versionId) : undefined;
  if (!version) throw new Response('Unknown version', { status: 404 });
  const [versions, catalog] = await Promise.all([
    repository.getVersions(),
    repository.getCatalog(),
  ]);
  return { version, versions, catalog };
}

export function isValidLocalDate(date: string | undefined): date is string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  return addDays(date, 0) === date;
}

/** `/:versionId/day/:date` with a malformed date → Today. */
export function dayLoader({ params }: LoaderFunctionArgs) {
  if (!isValidLocalDate(params.date))
    return redirect(paths.today(params.versionId ?? defaultVersionId));
  return null;
}

/** `/:versionId` → its Today view. */
export function versionIndexLoader({ params }: LoaderFunctionArgs) {
  return redirect(paths.today(params.versionId ?? defaultVersionId));
}

export function isValidLocalMonth(month: string | undefined): month is string {
  return !!month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

function todayLocal(): string {
  return localDateOf(new Date(), userTimeZone());
}

/** `/:versionId/week/:date`: a malformed date → this week; any day → its week's first day. */
export function weekLoader({ params }: LoaderFunctionArgs) {
  const versionId = params.versionId ?? defaultVersionId;
  const weekStartsOn = useSettings.getState().weekStartsOn;
  const date = isValidLocalDate(params.date) ? params.date : todayLocal();
  const start = startOfWeek(date, weekStartsOn);
  return start === params.date ? null : redirect(paths.week(versionId, start));
}

/** `/:versionId/month/:month`: a malformed month → this month. */
export function monthLoader({ params }: LoaderFunctionArgs) {
  if (isValidLocalMonth(params.month)) return null;
  return redirect(paths.month(params.versionId ?? defaultVersionId, todayLocal().slice(0, 7)));
}
