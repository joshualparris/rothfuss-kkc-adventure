import Database from 'better-sqlite3';
import { runMigrations } from '../src/db/schema';
import { runSeed } from '../src/db/seed';
import { askKilvinForWork, getNpcTrust, respondToAmbrose, workFisheryShift } from '../src/engine/socialEngine';
import { initDefaultPlayerState } from '../src/engine/state';

describe('socialEngine', () => {
  const db = new Database(':memory:');

  beforeAll(() => {
    runMigrations(db);
    runSeed(db);
  });

  test('missing NPC id returns 50 trust', () => {
    expect(getNpcTrust(initDefaultPlayerState(), 'unknown_npc')).toBe(50);
  });

  test('existing ambrose trust from initDefaultPlayerState returns 20', () => {
    expect(getNpcTrust(initDefaultPlayerState(), 'ambrose')).toBe(20);
  });

  test('askKilvinForWork at wrong location returns denial and unchanged state', () => {
    const state = initDefaultPlayerState();
    const result = askKilvinForWork(state, db);

    expect(result.newState).toBe(state);
    expect(result.message.length).toBeGreaterThan(0);
  });

  test('askKilvinForWork at the Fishery while healthy sets approved_today true', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_fishery_outer'
    };
    const result = askKilvinForWork(state, db);

    expect(result.newState.fishery_state.approved_today).toBe(true);
  });

  test('askKilvinForWork at the Fishery with fatigue 90 returns denial and approved_today false', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_fishery_outer',
      fatigue: 90
    };
    const result = askKilvinForWork(state, db);

    expect(result.newState.fishery_state.approved_today).toBe(false);
  });

  test('workFisheryShift without approval returns the Kilvin denial line', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_fishery_outer'
    };
    const result = workFisheryShift(state, db);

    expect(result.message).toBe('Kilvin has not set you to work.');
  });

  test('workFisheryShift with approval increases money and sets completed shifts to 1', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_fishery_outer',
      fishery_state: {
        approved_today: true,
        shifts_completed_today: 0,
        last_approval_day: 1
      }
    };
    const result = workFisheryShift(state, db);

    expect(result.newState.money_drabs).toBeGreaterThan(state.money_drabs);
    expect(result.newState.fishery_state.shifts_completed_today).toBe(1);
  });

  test('third Fishery shift attempt after 2 completed shifts returns shift-complete denial', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_fishery_outer',
      fishery_state: {
        approved_today: true,
        shifts_completed_today: 2,
        last_approval_day: 1
      }
    };
    const result = workFisheryShift(state, db);

    expect(result.newState).toBe(state);
    expect(result.message.length).toBeGreaterThan(0);
  });

  test('successful Fishery shift advances time by 1 step', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_fishery_outer',
      fishery_state: {
        approved_today: true,
        shifts_completed_today: 0,
        last_approval_day: 1
      }
    };
    const result = workFisheryShift(state, db);

    expect(result.newState.time_of_day).toBe('afternoon');
  });

  test('respondToAmbrose when absent returns unchanged state', () => {
    const state = initDefaultPlayerState();
    const result = respondToAmbrose('ignore', state, db);

    expect(result.newState).toBe(state);
  });

  test('ignore ambrose lowers ambrose trust', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_archives_exterior'
    };
    const result = respondToAmbrose('ignore', state, db);

    expect(getNpcTrust(result.newState, 'ambrose')).toBeLessThan(getNpcTrust(state, 'ambrose'));
  });

  test('careful response increases university_social by 1', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_archives_exterior'
    };
    const result = respondToAmbrose('careful', state, db);

    expect(result.newState.reputation.university_social).toBe(state.reputation.university_social + 1);
  });

  test('sharp response lowers ambrose trust more than careful response', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_archives_exterior'
    };
    const carefulResult = respondToAmbrose('careful', state, db);
    const sharpResult = respondToAmbrose('sharp', state, db);

    expect(getNpcTrust(sharpResult.newState, 'ambrose')).toBeLessThan(
      getNpcTrust(carefulResult.newState, 'ambrose')
    );
  });
});
