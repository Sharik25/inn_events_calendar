/** Everything the build scripts need from `src/`, loaded in one go through Vite's module runner. */
export { eventCatalog, eventDefinitions } from '../../src/data/events';
export { versions } from '../../src/data/versions';
export { validateData } from '../../src/data/validate';
export { themeIds } from '../../src/themes';
export { buildFeeds } from '../../src/engine/feeds';
// Feeds are written in English.
export { en as strings } from '../../src/strings/en';
