import type { VersionConfig } from '@/domain/types';
import { anniversary } from './anniversary/version';
import { forever } from './forever/version';

/** Version registry, in picker order (the default first). Add a version: create its folder, then add it here. */
export const versions: VersionConfig[] = [forever, anniversary];

/** Where `/` goes until the user picks a version in the switcher. */
export const defaultVersionId = 'forever';
