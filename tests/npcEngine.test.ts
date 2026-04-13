import Database from 'better-sqlite3';
import { runMigrations } from '../src/db/schema';
import { runSeed } from '../src/db/seed';
import { getNPCsAtLocation } from '../src/engine/movement';
import { isNPCPresent, parseNPCCommand, talkToNPC } from '../src/engine/npcEngine';
import { initDefaultPlayerState } from '../src/engine/state';

describe('npcEngine', () => {
  const db = new Database(':memory:');

  beforeAll(() => {
    runMigrations(db);
    runSeed(db);
  });

  test('parseNPCCommand("talk to simmon") returns simmon with no topic', () => {
    expect(parseNPCCommand('talk to simmon')).toEqual({ npc_id: 'simmon', topic: null });
  });

  test('parseNPCCommand("ask wilem about classes") returns wilem and classes', () => {
    expect(parseNPCCommand('ask wilem about classes')).toEqual({
      npc_id: 'wilem',
      topic: 'classes'
    });
  });

  test('parseNPCCommand("look around") returns null', () => {
    expect(parseNPCCommand('look around')).toBeNull();
  });

  test('isNPCPresent returns true when npc.location_id matches state.location_id', () => {
    const [npc] = getNPCsAtLocation(db, 'university_ankers');
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_ankers'
    };

    expect(isNPCPresent(npc, state)).toBe(true);
  });

  test('isNPCPresent returns false when locations differ', () => {
    const [npc] = getNPCsAtLocation(db, 'university_ankers');
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_mains'
    };

    expect(isNPCPresent(npc, state)).toBe(false);
  });

  test("talkToNPC('simmon', null, state, db) at Anker's returns a non-empty string", () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_ankers'
    };
    const result = talkToNPC('simmon', null, state, db);

    expect(result.length).toBeGreaterThan(0);
  });

  test("talkToNPC('simmon', null, state, db) at the Mains returns a not-here message", () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_mains'
    };
    const result = talkToNPC('simmon', null, state, db);

    expect(result).toContain("isn't here");
  });

  test("talkToNPC('kilvin', 'work', stateAtFishery, db) returns a non-empty string", () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_fishery_outer'
    };
    const result = talkToNPC('kilvin', 'work', state, db);

    expect(result.length).toBeGreaterThan(0);
  });

  test("talkToNPC('ambrose', 'archives', stateAtArchivesExterior, db) returns a non-empty string", () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_archives_exterior'
    };
    const result = talkToNPC('ambrose', 'archives', state, db);

    expect(result.length).toBeGreaterThan(0);
  });

  test("talkToNPC('deoch', 'music', stateAtEolian, db) returns a non-empty string", () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'eolian_floor',
      time_of_day: 'evening' as const
    };
    const result = talkToNPC('deoch', 'music', state, db);

    expect(result.length).toBeGreaterThan(0);
  });

  test("talkToNPC('stanchion', 'pipes', stateAtEolian, db) returns a non-empty string", () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'eolian_floor',
      time_of_day: 'evening' as const
    };
    const result = talkToNPC('stanchion', 'pipes', state, db);

    expect(result.length).toBeGreaterThan(0);
  });
});
