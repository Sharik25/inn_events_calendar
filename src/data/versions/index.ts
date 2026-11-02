import type { VersionConfig } from '@/domain/types';
import { anniversary } from './anniversary/version';
import { forever } from './forever/version';

/** Version registry. Add a new version: create its folder, then add it to this list. */
export const versions: VersionConfig[] = [anniversary, forever];

/** Where `/` goes until the user picks a version in the switcher. */
export const defaultVersionId = 'forever';
