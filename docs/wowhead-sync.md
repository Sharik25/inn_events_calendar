# Syncing WoW: Forever events from Wowhead

WoW: Forever's world event dates come from Wowhead's Forever events page,
https://www.wowhead.com/forever/events#holidays. The app never calls Wowhead: a snapshot is
committed at `src/data/versions/forever/wowhead-events.json`.

## Why this is a manual export, not a scheduled fetch

- Wowhead's terms (ZAM Network LLC / Fanbyte EULA, last updated May 14, 2025, §8 "Prohibited
  Conduct") don't allow accessing or downloading content "using any engine, software, tool,
  agent, device or mechanism (including spiders, robots, crawlers, data mining tools or the
  like) other than … generally available third-party web browsers".
- Its CDN blocks non-browser clients: a request with an honest User-Agent naming this project
  gets HTTP 403 (checked Nov 9, 2026). Getting past that would mean pretending to be a browser.

So a person exports the data in their own browser, and everything after that is offline.

## Update the snapshot

1. Open https://www.wowhead.com/forever/events#holidays in your browser.
2. Open the developer console and run:

   ```js
   copy(JSON.stringify(g_listviews.holidays.data, null, 2));
   ```

3. Paste the clipboard into `data/wowhead/forever-holidays.export.json` (replace the file).
4. Run `npm run sync:wowhead`. Running it again makes no changes.
5. Commit the export and the snapshot together.

The command stops and keeps the last snapshot if the export's shape changed, the time zone
check fails, or the number of dated events or occurrences drops sharply (pass `--allow-drop`
after checking that the drop is real). CI runs `npm run sync:wowhead -- --check`, which fails
when the snapshot doesn't match the export.

## What the snapshot holds

- `events`: each event with dates, keyed by Wowhead's id (`sourceId`), times in UTC.
- `withoutDates`: events Wowhead lists without any dates. The app keeps its own dates for them.
- `unresolved`: unnamed `[#id]` placeholders. They are not imported. To import one, open
  `https://www.wowhead.com/forever/event=<id>` in your browser and add its name to
  `data/wowhead/event-names.json` (`{ "<id>": "<name>" }`).

## Time zone

The export's times have no zone. They are read as US Pacific wall-clock time, and every run
checks that from the data: each weekly Call to Arms week must then start at the US weekly reset
(Tuesday 15:00 UTC, i.e. 07:00 in winter and 08:00 in summer), with starts on both sides of a US
DST change. If that doesn't hold, or the export has no starts on both sides, the run stops.
