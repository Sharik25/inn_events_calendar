import { act } from '@testing-library/react';
import { CHECKLIST_STORAGE_KEY, useChecklist } from './checklist';

const KEY = 'anniversary:stv-fishing:2026-11-22T13:00:00.000Z';

beforeEach(() => {
  localStorage.clear();
  useChecklist.getState().reload();
});

afterEach(() => vi.restoreAllMocks());

describe('checklist store', () => {
  it('saves ticks per occurrence in a versioned envelope', () => {
    act(() => useChecklist.getState().toggle(KEY, 'quest-master-angler', true));
    expect(JSON.parse(localStorage.getItem(CHECKLIST_STORAGE_KEY)!)).toEqual({
      version: 1,
      done: { [KEY]: ['quest-master-angler'] },
    });
    act(() => useChecklist.getState().toggle(KEY, 'quest-master-angler', false));
    expect(JSON.parse(localStorage.getItem(CHECKLIST_STORAGE_KEY)!).done).toEqual({});
  });

  it('ignores corrupt or unknown stored data', () => {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, '{not json');
    useChecklist.getState().reload();
    expect(useChecklist.getState().done).toEqual({});
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify({ version: 9, done: { a: ['x'] } }));
    useChecklist.getState().reload();
    expect(useChecklist.getState().done).toEqual({});
    localStorage.setItem(
      CHECKLIST_STORAGE_KEY,
      JSON.stringify({ version: 1, done: { a: ['x'], b: 'oops' } }),
    );
    useChecklist.getState().reload();
    expect(useChecklist.getState().done).toEqual({ a: ['x'] });
  });

  it('keeps working in memory when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => useChecklist.getState().reload()).not.toThrow();
    act(() => useChecklist.getState().toggle(KEY, 'quest-master-angler', true));
    expect(useChecklist.getState().done[KEY]).toEqual(['quest-master-angler']);
  });
});
