import type Database from 'better-sqlite3';
import {
  AMBROSE_CAREFUL_RESPONSE_LINES,
  AMBROSE_IGNORE_LINES,
  AMBROSE_NOT_HERE_LINES,
  AMBROSE_SHARP_RESPONSE_LINES,
  KILVIN_WORK_ALREADY_APPROVED,
  KILVIN_WORK_APPROVAL,
  KILVIN_WORK_DENIAL_NOT_HERE,
  KILVIN_WORK_DENIAL_UNFIT,
  KILVIN_WORK_SHIFT_COMPLETE
} from '../content/authorityDialogue';
import { getNPCsAtLocation } from './movement';
import { advanceTime } from './time';
import type { NPC, PlayerState } from '../types';

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function lineForDay(lines: string[], dayNumber: number): string {
  return lines[dayNumber % 3];
}

function findNpcById(npcs: NPC[], id: string): NPC | null {
  return npcs.find((npc) => npc.id === id) ?? null;
}

export function getNpcTrust(state: PlayerState, npc_id: string): number {
  return state.reputation.npc_trust[npc_id] ?? 50;
}

export function setNpcTrust(
  state: PlayerState,
  npc_id: string,
  value: number
): PlayerState {
  return {
    ...state,
    reputation: {
      ...state.reputation,
      npc_trust: {
        ...state.reputation.npc_trust,
        [npc_id]: clamp(value, 0, 100)
      }
    }
  };
}

export function adjustUniversitySocial(
  state: PlayerState,
  delta: number
): PlayerState {
  return {
    ...state,
    reputation: {
      ...state.reputation,
      university_social: clamp(state.reputation.university_social + delta, 0, 100)
    }
  };
}

export function askKilvinForWork(
  state: PlayerState,
  db: InstanceType<typeof Database>
): { message: string; newState: PlayerState } {
  if (state.location_id !== 'university_fishery_outer') {
    return {
      message: lineForDay(KILVIN_WORK_DENIAL_NOT_HERE, state.day_number),
      newState: state
    };
  }

  const npcs = getNPCsAtLocation(db, state.location_id);
  const kilvin = findNpcById(npcs, 'kilvin');

  if (!kilvin) {
    return {
      message: lineForDay(KILVIN_WORK_DENIAL_NOT_HERE, state.day_number),
      newState: state
    };
  }

  if (state.fatigue > 80 || state.warmth < 25 || state.injuries.length > 0) {
    return {
      message: lineForDay(KILVIN_WORK_DENIAL_UNFIT, state.day_number),
      newState: setNpcTrust(state, 'kilvin', getNpcTrust(state, 'kilvin') - 1)
    };
  }

  if (state.fishery_state.approved_today) {
    return {
      message: lineForDay(KILVIN_WORK_ALREADY_APPROVED, state.day_number),
      newState: state
    };
  }

  const approvedState = setNpcTrust(
    {
      ...state,
      fishery_state: {
        ...state.fishery_state,
        approved_today: true,
        last_approval_day: state.day_number
      }
    },
    'kilvin',
    getNpcTrust(state, 'kilvin') + 2
  );

  return {
    message: lineForDay(KILVIN_WORK_APPROVAL, state.day_number),
    newState: approvedState
  };
}

export function workFisheryShift(
  state: PlayerState,
  db: InstanceType<typeof Database>
): { message: string; newState: PlayerState } {
  if (state.location_id !== 'university_fishery_outer' || !state.fishery_state.approved_today) {
    return {
      message: 'Kilvin has not set you to work.',
      newState: state
    };
  }

  if (state.fishery_state.shifts_completed_today >= 2) {
    return {
      message: lineForDay(KILVIN_WORK_SHIFT_COMPLETE, state.day_number),
      newState: state
    };
  }

  const pay = 2 + ((state.day_number + state.fishery_state.shifts_completed_today) % 2);
  const advancedState = advanceTime(state, 1);
  const warmedState = {
    ...advancedState,
    money_drabs: advancedState.money_drabs + pay,
    fatigue: clamp(advancedState.fatigue + 12, 0, 100),
    hunger: clamp(advancedState.hunger + 8, 0, 100),
    warmth: clamp(advancedState.warmth + 5, 0, 100),
    sympathy_state: {
      ...advancedState.sympathy_state,
      warmth: clamp(advancedState.sympathy_state.warmth + 5, 0, 100)
    },
    fishery_state: {
      ...advancedState.fishery_state,
      shifts_completed_today: advancedState.fishery_state.shifts_completed_today + 1
    },
    reputation: {
      ...advancedState.reputation,
      academic_standing: clamp(advancedState.reputation.academic_standing + 1, 0, 100)
    }
  };
  const trustedState = setNpcTrust(
    warmedState,
    'kilvin',
    getNpcTrust(warmedState, 'kilvin') + 1
  );

  return {
    message: `You spend the shift on hot, careful work that asks more patience than brilliance. When it is done, you are paid ${pay} drabs for it.`,
    newState: trustedState
  };
}

export function respondToAmbrose(
  mode: 'ignore' | 'careful' | 'sharp',
  state: PlayerState,
  db: InstanceType<typeof Database>
): { message: string; newState: PlayerState } {
  const npcs = getNPCsAtLocation(db, state.location_id);
  const ambrose = findNpcById(npcs, 'ambrose');

  if (!ambrose) {
    return {
      message: lineForDay(AMBROSE_NOT_HERE_LINES, state.day_number),
      newState: state
    };
  }

  if (mode === 'ignore') {
    return {
      message: lineForDay(AMBROSE_IGNORE_LINES, state.day_number),
      newState: setNpcTrust(state, 'ambrose', getNpcTrust(state, 'ambrose') - 2)
    };
  }

  if (mode === 'careful') {
    return {
      message: lineForDay(AMBROSE_CAREFUL_RESPONSE_LINES, state.day_number),
      newState: adjustUniversitySocial(
        setNpcTrust(state, 'ambrose', getNpcTrust(state, 'ambrose') - 4),
        1
      )
    };
  }

  return {
    message: lineForDay(AMBROSE_SHARP_RESPONSE_LINES, state.day_number),
    newState: adjustUniversitySocial(
      setNpcTrust(state, 'ambrose', getNpcTrust(state, 'ambrose') - 10),
      2
    )
  };
}
