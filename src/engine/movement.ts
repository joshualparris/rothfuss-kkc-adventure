import type Database from 'better-sqlite3';
import { EOLIAN_NOT_OPEN_LINES } from '../content/eolianDialogue';
import type { Exit, Location, NPC, PlayerState } from '../types';

interface LocationRow {
  id: string;
  name: string;
  era: string;
  tier: 1 | 2 | 3;
  cluster_id: string;
  description_base: string;
  exits: string;
  is_accessible: number;
  travel_time_minutes: number;
  canon_source: string | null;
}

interface NpcRow {
  id: string;
  name: string;
  location_id: string;
  era: string;
  temperament: string;
  speech_style: string;
  conditions: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function isExit(value: unknown): value is Exit {
  if (!isRecord(value)) {
    return false;
  }

  const { direction, target_location_id, access_condition } = value;

  return (
    typeof direction === 'string' &&
    typeof target_location_id === 'string' &&
    (typeof access_condition === 'string' || typeof access_condition === 'undefined')
  );
}

function parseExits(value: string): Exit[] {
  const parsed = parseJson(value);
  return Array.isArray(parsed) ? parsed.filter(isExit) : [];
}

function rowToLocation(row: LocationRow): Location {
  return {
    id: row.id,
    name: row.name,
    era: row.era,
    tier: row.tier,
    cluster_id: row.cluster_id,
    description_base: row.description_base,
    exits: parseExits(row.exits),
    is_accessible: row.is_accessible === 1,
    travel_time_minutes: row.travel_time_minutes,
    canon_source: row.canon_source ?? undefined
  };
}

export function getLocation(db: InstanceType<typeof Database>, id: string): Location | null {
  const row = db
    .prepare(
      `
        SELECT
          id,
          name,
          era,
          tier,
          cluster_id,
          description_base,
          exits,
          is_accessible,
          travel_time_minutes,
          canon_source
        FROM locations
        WHERE id = ?
      `
    )
    .get(id) as LocationRow | undefined;

  return row ? rowToLocation(row) : null;
}

export function getAllLocations(db: InstanceType<typeof Database>): Location[] {
  const rows = db
    .prepare(
      `
        SELECT
          id,
          name,
          era,
          tier,
          cluster_id,
          description_base,
          exits,
          is_accessible,
          travel_time_minutes,
          canon_source
        FROM locations
        ORDER BY id
      `
    )
    .all() as LocationRow[];

  return rows.map(rowToLocation);
}

export function getNPCsAtLocation(
  db: InstanceType<typeof Database>,
  location_id: string
): NPC[] {
  const rows = db
    .prepare(
      `
        SELECT
          id,
          name,
          location_id,
          era,
          temperament,
          speech_style,
          conditions
        FROM npcs
        WHERE location_id = ?
        ORDER BY name
      `
    )
    .all(location_id) as NpcRow[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    location_id: row.location_id,
    era: row.era,
    temperament: row.temperament,
    speech_style: row.speech_style,
    conditions: row.conditions ?? undefined
  }));
}

export function getAccessibleExits(location: Location, state: PlayerState): Exit[] {
  return location.exits.filter((exit) => {
    if (!exit.access_condition) {
      return true;
    }

    if (exit.access_condition === 'requires_Re_lar') {
      return state.academic_rank === 'Re_lar' || state.academic_rank === 'El_the';
    }

    if (exit.access_condition === 'locked_at_night') {
      return state.time_of_day !== 'night';
    }

    if (exit.access_condition === 'open_evening') {
      return state.time_of_day === 'evening' || state.time_of_day === 'night';
    }

    return true;
  });
}

export function movePlayer(
  db: InstanceType<typeof Database>,
  state: PlayerState,
  direction: string
): { success: boolean; newState: PlayerState; message: string } {
  const currentLocation = getLocation(db, state.location_id);

  if (!currentLocation) {
    throw new Error(`Current location "${state.location_id}" was not found.`);
  }

  const requestedDirection = direction.trim().toLowerCase();
  const matchingExit = currentLocation.exits.find(
    (exit) => exit.direction.toLowerCase() === requestedDirection
  );

  if (!matchingExit) {
    return {
      success: false,
      newState: state,
      message: 'You cannot go that way.'
    };
  }

  if (
    matchingExit.access_condition === 'requires_Re_lar' &&
    (state.academic_rank === 'E_lir' || state.academic_rank === 'none')
  ) {
    return {
      success: false,
      newState: state,
      message: "The Stacks are closed to you. Only a Re'lar may enter the Archives unescorted."
    };
  }

  if (matchingExit.access_condition === 'locked_at_night' && state.time_of_day === 'night') {
    return {
      success: false,
      newState: state,
      message: 'That way is shut for the night.'
    };
  }

  if (
    matchingExit.access_condition === 'open_evening' &&
    state.time_of_day !== 'evening' &&
    state.time_of_day !== 'night'
  ) {
    return {
      success: false,
      newState: state,
      message: EOLIAN_NOT_OPEN_LINES[state.day_number % 3]
    };
  }

  return {
    success: true,
    newState: {
      ...state,
      location_id: matchingExit.target_location_id
    },
    message: ''
  };
}
