// Fails fast with a clear message on a too-old Node, instead of a cryptic error deep inside
// Vite / rolldown (e.g. "node:util does not provide an export named 'styleText'" on Node 18).
// Plain JS so it runs on any Node version; the minimum comes from package.json "engines".
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const [minMajor = 0, minMinor = 0] = pkg.engines.node
  .replace(/^>=\s*/, '')
  .split('.')
  .map(Number);
const [major = 0, minor = 0] = process.versions.node.split('.').map(Number);

if (major < minMajor || (major === minMajor && minor < minMinor)) {
  console.error(
    `\nThis project needs Node ${pkg.engines.node} (see .nvmrc), but this terminal runs Node ${process.versions.node}.\n` +
      'Run `nvm use` in the project folder (or `nvm alias default 22` to make it the default), then try again.\n',
  );
  process.exit(1);
}
