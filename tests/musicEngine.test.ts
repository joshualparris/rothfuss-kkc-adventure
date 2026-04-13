import Database from 'better-sqlite3';
import { runMigrations } from '../src/db/schema';
import { runSeed } from '../src/db/seed';
import { movePlayer } from '../src/engine/movement';
import {
  auditionForPipes,
  calculateAuditionScore,
  canEnterEolian,
  isLutePresent,
  playAtEolian
} from '../src/engine/musicEngine';
import { initDefaultPlayerState } from '../src/engine/state';

describe('musicEngine', () => {
  const db = new Database(':memory:');

  beforeAll(() => {
    runMigrations(db);
    runSeed(db);
  });

  test('default player state has a lute present', () => {
    expect(isLutePresent(initDefaultPlayerState())).toBe(true);
  });

  test('state without a lute returns false for isLutePresent', () => {
    const state = {
      ...initDefaultPlayerState(),
      inventory: initDefaultPlayerState().inventory.filter((item) => item.id !== 'lute')
    };

    expect(isLutePresent(state)).toBe(false);
  });

  test('canEnterEolian returns true in the evening', () => {
    const state = {
      ...initDefaultPlayerState(),
      time_of_day: 'evening' as const
    };

    expect(canEnterEolian(state)).toBe(true);
  });

  test('canEnterEolian returns false in the morning', () => {
    expect(canEnterEolian(initDefaultPlayerState())).toBe(false);
  });

  test('healthy default state with a lute returns a score above zero', () => {
    expect(calculateAuditionScore(initDefaultPlayerState())).toBeGreaterThan(0);
  });

  test('exhausted and hungry state scores lower than a healthy state', () => {
    const healthyState = initDefaultPlayerState();
    const wornState = {
      ...healthyState,
      fatigue: 85,
      hunger: 85,
      warmth: 30
    };

    expect(calculateAuditionScore(wornState)).toBeLessThan(
      calculateAuditionScore(healthyState)
    );
  });

  test('auditionForPipes at the wrong location returns blocked and unchanged state', () => {
    const state = initDefaultPlayerState();
    const result = auditionForPipes(state, db);

    expect(result.newState).toBe(state);
    expect(result.message.length).toBeGreaterThan(0);
  });

  test('auditionForPipes at the Eolian in the evening sets last_audition_day', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'eolian_floor',
      time_of_day: 'evening' as const
    };
    const result = auditionForPipes(state, db);

    expect(result.newState.eolian_state.last_audition_day).toBe(state.day_number);
    expect(result.message.length).toBeGreaterThan(0);
  });

  test('second audition attempt on the same day returns blocked', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'eolian_floor',
      time_of_day: 'evening' as const
    };
    const firstResult = auditionForPipes(state, db);
    const secondResult = auditionForPipes(firstResult.newState, db);

    expect(secondResult.newState).toBe(firstResult.newState);
    expect(secondResult.message.length).toBeGreaterThan(0);
  });

  test('successful audition sets has_talent_pipes true', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'eolian_floor',
      time_of_day: 'evening' as const
    };
    const result = auditionForPipes(state, db);

    expect(result.newState.eolian_state.has_talent_pipes).toBe(true);
  });

  test('playAtEolian without talent pipes returns blocked and unchanged state', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'eolian_floor',
      time_of_day: 'evening' as const
    };
    const result = playAtEolian(state, db);

    expect(result.newState).toBe(state);
    expect(result.message.length).toBeGreaterThan(0);
  });

  test('playAtEolian with talent pipes advances time and increments performances_today', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'eolian_floor',
      time_of_day: 'evening' as const,
      eolian_state: {
        ...initDefaultPlayerState().eolian_state,
        has_talent_pipes: true
      }
    };
    const result = playAtEolian(state, db);

    expect(result.newState.time_of_day).toBe('night');
    expect(result.newState.eolian_state.performances_today).toBe(1);
  });

  test('second Eolian performance on the same day returns blocked', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'eolian_floor',
      time_of_day: 'evening' as const,
      eolian_state: {
        ...initDefaultPlayerState().eolian_state,
        has_talent_pipes: true
      }
    };
    const firstResult = playAtEolian(state, db);
    const secondResult = playAtEolian(firstResult.newState, db);

    expect(secondResult.newState).toBe(firstResult.newState);
    expect(secondResult.message.length).toBeGreaterThan(0);
  });

  test('entering the Eolian in the afternoon returns a blocked line instead of no-exit text', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'eolian_exterior',
      time_of_day: 'afternoon' as const
    };
    const result = movePlayer(db, state, 'enter');

    expect(result.success).toBe(false);
    expect(result.message).not.toBe('You cannot go that way.');
  });

  test('entering the Eolian in the evening succeeds', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'eolian_exterior',
      time_of_day: 'evening' as const
    };
    const result = movePlayer(db, state, 'enter');

    expect(result.success).toBe(true);
    expect(result.newState.location_id).toBe('eolian_floor');
  });
});
