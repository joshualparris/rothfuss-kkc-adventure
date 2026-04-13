import type Database from 'better-sqlite3';
import type {
  AcademicRank,
  EolianState,
  FisheryState,
  InventoryItem,
  PlayerState,
  Reputation,
  SympathyState,
  TimeOfDay,
  TuitionState
} from '../types';

interface PlayerStateRow {
  character_id: string;
  era: string;
  location_id: string;
  money_drabs: number;
  inventory: string;
  reputation: string;
  time_of_day: string;
  day_number: number;
  term_number: number;
  injuries: string;
  hunger: number;
  fatigue: number;
  academic_rank: string;
  tuition_state: string;
  sympathy_state: string;
  fishery_state: string;
  eolian_state: string;
  warmth: number;
  world_state_flags: string;
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

function isInventoryItem(value: unknown): value is InventoryItem {
  if (!isRecord(value)) {
    return false;
  }

  const { id, name, quantity, notes } = value;

  return (
    typeof id === 'string' &&
    typeof name === 'string' &&
    typeof quantity === 'number' &&
    (typeof notes === 'string' || typeof notes === 'undefined')
  );
}

function parseInventory(value: string): InventoryItem[] {
  const parsed = parseJson(value);
  return Array.isArray(parsed) ? parsed.filter(isInventoryItem) : [];
}

function parseNpcTrust(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {};
  }

  const entries = Object.entries(value).filter((entry): entry is [string, number] => {
    return typeof entry[1] === 'number';
  });

  return Object.fromEntries(entries);
}

function parseReputation(value: string): Reputation {
  const parsed = parseJson(value);

  if (!isRecord(parsed)) {
    return {
      academic_standing: 0,
      university_social: 0,
      eolian_standing: 0,
      npc_trust: {}
    };
  }

  return {
    academic_standing:
      typeof parsed.academic_standing === 'number' ? parsed.academic_standing : 0,
    university_social:
      typeof parsed.university_social === 'number' ? parsed.university_social : 0,
    eolian_standing:
      typeof parsed.eolian_standing === 'number' ? parsed.eolian_standing : 0,
    npc_trust: parseNpcTrust(parsed.npc_trust)
  };
}

function parseInjuries(value: string): string[] {
  const parsed = parseJson(value);
  return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : [];
}

function parseWorldStateFlags(value: string): Record<string, boolean | string | number> {
  const parsed = parseJson(value);

  if (!isRecord(parsed)) {
    return {};
  }

  const entries = Object.entries(parsed).filter(
    (
      entry
    ): entry is [string, boolean | string | number] =>
      typeof entry[1] === 'boolean' ||
      typeof entry[1] === 'string' ||
      typeof entry[1] === 'number'
  );

  return Object.fromEntries(entries);
}

function parseTuitionState(value: string): TuitionState {
  const parsed = parseJson(value);

  if (!isRecord(parsed)) {
    return {
      amount_drabs: 30,
      due_on_day: 14,
      paid: false,
      overdue: false
    };
  }

  return {
    amount_drabs: typeof parsed.amount_drabs === 'number' ? parsed.amount_drabs : 30,
    due_on_day: typeof parsed.due_on_day === 'number' ? parsed.due_on_day : 14,
    paid: typeof parsed.paid === 'boolean' ? parsed.paid : false,
    overdue: typeof parsed.overdue === 'boolean' ? parsed.overdue : false
  };
}

function parseSympathyState(value: string): SympathyState {
  const parsed = parseJson(value);

  if (!isRecord(parsed)) {
    return {
      alar_strength: 60,
      warmth: 80,
      active_bindings: 0,
      times_used_today: 0
    };
  }

  return {
    alar_strength: typeof parsed.alar_strength === 'number' ? parsed.alar_strength : 60,
    warmth: typeof parsed.warmth === 'number' ? parsed.warmth : 80,
    active_bindings: typeof parsed.active_bindings === 'number' ? parsed.active_bindings : 0,
    times_used_today: typeof parsed.times_used_today === 'number' ? parsed.times_used_today : 0
  };
}

function parseFisheryState(value: string): FisheryState {
  const parsed = parseJson(value);

  if (!isRecord(parsed)) {
    return {
      approved_today: false,
      shifts_completed_today: 0,
      last_approval_day: null
    };
  }

  return {
    approved_today: typeof parsed.approved_today === 'boolean' ? parsed.approved_today : false,
    shifts_completed_today:
      typeof parsed.shifts_completed_today === 'number' ? parsed.shifts_completed_today : 0,
    last_approval_day:
      typeof parsed.last_approval_day === 'number' || parsed.last_approval_day === null
        ? parsed.last_approval_day
        : null
  };
}

function parseEolianState(value: string): EolianState {
  const parsed = parseJson(value);

  if (!isRecord(parsed)) {
    return {
      has_talent_pipes: false,
      last_audition_day: null,
      performances_today: 0
    };
  }

  return {
    has_talent_pipes:
      typeof parsed.has_talent_pipes === 'boolean' ? parsed.has_talent_pipes : false,
    last_audition_day:
      typeof parsed.last_audition_day === 'number' || parsed.last_audition_day === null
        ? parsed.last_audition_day
        : null,
    performances_today:
      typeof parsed.performances_today === 'number' ? parsed.performances_today : 0
  };
}

function parseTimeOfDay(value: string): TimeOfDay {
  if (
    value === 'morning' ||
    value === 'afternoon' ||
    value === 'evening' ||
    value === 'night'
  ) {
    return value;
  }

  return 'morning';
}

function parseAcademicRank(value: string): AcademicRank {
  if (value === 'none' || value === 'E_lir' || value === 'Re_lar' || value === 'El_the') {
    return value;
  }

  return 'none';
}

export function loadPlayerState(db: InstanceType<typeof Database>): PlayerState | null {
  const row = db
    .prepare(
      `
        SELECT
          character_id,
          era,
          location_id,
          money_drabs,
          inventory,
          reputation,
          time_of_day,
          day_number,
          term_number,
          injuries,
          hunger,
          fatigue,
          academic_rank,
          tuition_state,
          sympathy_state,
          fishery_state,
          eolian_state,
          warmth,
          world_state_flags
        FROM player_state
        WHERE id = 1
      `
    )
    .get() as PlayerStateRow | undefined;

  if (!row) {
    return null;
  }

  const sympathyState = parseSympathyState(row.sympathy_state);
  const fisheryState = parseFisheryState(row.fishery_state);
  const eolianState = parseEolianState(row.eolian_state);

  return {
    character_id: row.character_id,
    era: row.era,
    location_id: row.location_id,
    money_drabs: row.money_drabs,
    inventory: parseInventory(row.inventory),
    reputation: parseReputation(row.reputation),
    time_of_day: parseTimeOfDay(row.time_of_day),
    day_number: row.day_number,
    term_number: row.term_number,
    injuries: parseInjuries(row.injuries),
    hunger: row.hunger,
    fatigue: row.fatigue,
    academic_rank: parseAcademicRank(row.academic_rank),
    tuition_state: parseTuitionState(row.tuition_state),
    sympathy_state: sympathyState,
    fishery_state: fisheryState,
    eolian_state: eolianState,
    warmth: typeof row.warmth === 'number' ? row.warmth : sympathyState.warmth,
    world_state_flags: parseWorldStateFlags(row.world_state_flags)
  };
}

export function savePlayerState(db: InstanceType<typeof Database>, state: PlayerState): void {
  db.prepare(`
    INSERT INTO player_state (
      id,
      character_id,
      era,
      location_id,
      money_drabs,
      inventory,
      reputation,
      time_of_day,
      day_number,
      term_number,
      injuries,
      hunger,
      fatigue,
      academic_rank,
      tuition_state,
      sympathy_state,
      fishery_state,
      eolian_state,
      warmth,
      world_state_flags
    ) VALUES (
      1,
      @character_id,
      @era,
      @location_id,
      @money_drabs,
      @inventory,
      @reputation,
      @time_of_day,
      @day_number,
      @term_number,
      @injuries,
      @hunger,
      @fatigue,
      @academic_rank,
      @tuition_state,
      @sympathy_state,
      @fishery_state,
      @eolian_state,
      @warmth,
      @world_state_flags
    )
    ON CONFLICT(id) DO UPDATE SET
      character_id = excluded.character_id,
      era = excluded.era,
      location_id = excluded.location_id,
      money_drabs = excluded.money_drabs,
      inventory = excluded.inventory,
      reputation = excluded.reputation,
      time_of_day = excluded.time_of_day,
      day_number = excluded.day_number,
      term_number = excluded.term_number,
      injuries = excluded.injuries,
      hunger = excluded.hunger,
      fatigue = excluded.fatigue,
      academic_rank = excluded.academic_rank,
      tuition_state = excluded.tuition_state,
      sympathy_state = excluded.sympathy_state,
      fishery_state = excluded.fishery_state,
      eolian_state = excluded.eolian_state,
      warmth = excluded.warmth,
      world_state_flags = excluded.world_state_flags
  `).run({
    ...state,
    inventory: JSON.stringify(state.inventory),
    reputation: JSON.stringify(state.reputation),
    injuries: JSON.stringify(state.injuries),
    tuition_state: JSON.stringify(state.tuition_state),
    sympathy_state: JSON.stringify(state.sympathy_state),
    fishery_state: JSON.stringify(state.fishery_state),
    eolian_state: JSON.stringify(state.eolian_state),
    world_state_flags: JSON.stringify(state.world_state_flags)
  });
}

export function initDefaultPlayerState(): PlayerState {
  return {
    character_id: 'kvothe',
    era: 'university',
    location_id: 'university_mews_room',
    money_drabs: 300,
    inventory: [
      {
        id: 'lute',
        name: "Kvothe's lute",
        quantity: 1,
        notes: 'Old but well-kept. Handle carefully.'
      },
      {
        id: 'candle_tallow',
        name: 'tallow candle',
        quantity: 3,
        notes: 'Basic sympathetic binding material.'
      },
      {
        id: 'wicking',
        name: 'wicking cord',
        quantity: 1,
        notes: 'For use in sympathy preparations.'
      }
    ],
    reputation: {
      academic_standing: 50,
      university_social: 40,
      eolian_standing: 30,
      npc_trust: {
        simmon: 60,
        wilem: 55,
        anker: 50,
        kilvin: 45,
        ambrose: 20
      }
    },
    time_of_day: 'morning',
    day_number: 1,
    term_number: 1,
    injuries: [],
    hunger: 10,
    fatigue: 10,
    academic_rank: 'E_lir',
    tuition_state: {
      amount_drabs: 30,
      due_on_day: 14,
      paid: false,
      overdue: false
    },
    sympathy_state: {
      alar_strength: 60,
      warmth: 80,
      active_bindings: 0,
      times_used_today: 0
    },
    fishery_state: {
      approved_today: false,
      shifts_completed_today: 0,
      last_approval_day: null
    },
    eolian_state: {
      has_talent_pipes: false,
      last_audition_day: null,
      performances_today: 0
    },
    warmth: 80,
    world_state_flags: {}
  };
}
