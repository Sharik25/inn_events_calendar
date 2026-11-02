import type { EventCatalog, EventDefinition } from '@/domain/types';
import { lunarFestival } from './lunar-festival';
import { loveIsInTheAir } from './love-is-in-the-air';
import { noblegarden } from './noblegarden';
import { childrensWeek } from './childrens-week';
import { midsummer } from './midsummer';
import { fireworksSpectacular } from './fireworks-spectacular';
import { harvestFestival } from './harvest-festival';
import { brewfest } from './brewfest';
import { hallowsEnd } from './hallows-end';
import { winterVeil } from './winter-veil';
import { newYear } from './new-year';
import { darkmoonFaire } from './darkmoon-faire';
import { stvFishing } from './stv-fishing';
import { weeklyReset } from './weekly-reset';

/** All known events. Add a new event: create its file, then add it to this list. */
export const eventDefinitions: EventDefinition[] = [
  lunarFestival,
  loveIsInTheAir,
  noblegarden,
  childrensWeek,
  midsummer,
  fireworksSpectacular,
  harvestFestival,
  brewfest,
  hallowsEnd,
  winterVeil,
  newYear,
  darkmoonFaire,
  stvFishing,
  weeklyReset,
];

export const eventCatalog: EventCatalog = Object.fromEntries(
  eventDefinitions.map((e) => [e.id, e]),
);
