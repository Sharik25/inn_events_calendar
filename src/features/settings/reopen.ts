/**
 * Switching language remounts the app (see app/providers), which would close the settings sheet
 * the user is in. The picker sets this one-shot flag so the new layout opens it again.
 */
let reopen = false;

export function reopenSettingsAfterRemount(): void {
  reopen = true;
}

export function takeReopenSettings(): boolean {
  const value = reopen;
  reopen = false;
  return value;
}
