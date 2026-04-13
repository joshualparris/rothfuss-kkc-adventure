import Database from 'better-sqlite3';
import { runMigrations } from '../src/db/schema';
import { runSeed } from '../src/db/seed';
import { getLocation, movePlayer } from '../src/engine/movement';
import { initDefaultPlayerState } from '../src/engine/state';
import { advanceTime } from '../src/engine/time';
import { formatCurrency } from '../src/narration/renderStatus';

describe('formatCurrency', () => {
  test('formats talents only', () => {
    expect(formatCurrency(300)).toBe('3 talents');
  });

  test('formats jots and drabs', () => {
    expect(formatCurrency(15)).toBe('1 jot, 5 drabs');
  });

  test('formats drabs only', () => {
    expect(formatCurrency(7)).toBe('7 drabs');
  });

  test('formats nothing', () => {
    expect(formatCurrency(0)).toBe('nothing');
  });
});

describe('advanceTime', () => {
  test('moves morning to afternoon without incrementing the day', () => {
    const state = initDefaultPlayerState();
    const advanced = advanceTime(state);

    expect(advanced.time_of_day).toBe('afternoon');
    expect(advanced.day_number).toBe(1);
  });

  test('moves night to morning and increments the day', () => {
    const state = {
      ...initDefaultPlayerState(),
      time_of_day: 'night' as const
    };
    const advanced = advanceTime(state);

    expect(advanced.time_of_day).toBe('morning');
    expect(advanced.day_number).toBe(2);
  });
});

describe('movePlayer', () => {
  const db = new Database(':memory:');

  beforeAll(() => {
    runMigrations(db);
    runSeed(db);
  });

  test('moves north from the Mains to the Artificery', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_mains'
    };
    const mains = getLocation(db, state.location_id);
    const result = movePlayer(db, state, 'north');

    expect(mains?.name).toBe('the Mains');
    expect(result.success).toBe(true);
    expect(result.newState.location_id).toBe('university_artificery');
  });

  test('fails when no exit exists in that direction', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_artificery'
    };
    const result = movePlayer(db, state, 'west');

    expect(result.success).toBe(false);
    expect(result.message).toBe('You cannot go that way.');
  });

  test("blocks Archives entry for an E'lir", () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_archives_exterior'
    };
    const result = movePlayer(db, state, 'enter');

    expect(result.success).toBe(false);
    expect(result.message).toContain("Re'lar");
  });
});
