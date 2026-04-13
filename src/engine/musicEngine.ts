import type Database from 'better-sqlite3';
import {
  EOLIAN_AUDITION_BLOCKED,
  EOLIAN_AUDITION_FAIL,
  EOLIAN_AUDITION_SUCCESS,
  EOLIAN_NOT_OPEN_LINES,
  EOLIAN_PLAY_LINES
} from '../content/eolianDialogue';
import type { PlayerState } from '../types';
import { advanceTime } from './time';

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function dialogueIndex(state: PlayerState): number {
  return state.day_number % 3;
}

export function isLutePresent(state: PlayerState): boolean {
  return state.inventory.some((item) => item.id === 'lute' && item.quantity >= 1);
}

export function canEnterEolian(state: PlayerState): boolean {
  return state.time_of_day === 'evening' || state.time_of_day === 'night';
}

export function calculateAuditionScore(state: PlayerState): number {
  if (!isLutePresent(state)) {
    return 0;
  }

  let score = 50;

  if (state.reputation.eolian_standing >= 40) {
    score += 10;
  } else if (state.reputation.eolian_standing >= 30) {
    score += 5;
  }

  if (state.reputation.university_social >= 50) {
    score += 3;
  }

  if (state.fatigue >= 70) {
    score -= 15;
  } else if (state.fatigue >= 40) {
    score -= 5;
  }

  if (state.hunger >= 70) {
    score -= 10;
  } else if (state.hunger >= 40) {
    score -= 4;
  }

  if (state.warmth < 40) {
    score -= 5;
  }

  if (state.injuries.length > 0) {
    score -= 10;
  }

  return clamp(score);
}

export function auditionForPipes(
  state: PlayerState,
  db: InstanceType<typeof Database>
): { message: string; newState: PlayerState } {
  void db;

  const blockedLine = EOLIAN_AUDITION_BLOCKED[dialogueIndex(state)];

  if (state.location_id !== 'eolian_floor') {
    return {
      message: blockedLine,
      newState: state
    };
  }

  if (!canEnterEolian(state)) {
    return {
      message: blockedLine,
      newState: state
    };
  }

  if (!isLutePresent(state)) {
    return {
      message: blockedLine,
      newState: state
    };
  }

  if (state.eolian_state.has_talent_pipes) {
    return {
      message: blockedLine,
      newState: state
    };
  }

  if (state.eolian_state.last_audition_day === state.day_number) {
    return {
      message: blockedLine,
      newState: state
    };
  }

  const score = calculateAuditionScore(state);

  if (score >= 50) {
    return {
      message: EOLIAN_AUDITION_SUCCESS[dialogueIndex(state)],
      newState: {
        ...state,
        reputation: {
          ...state.reputation,
          eolian_standing: clamp(state.reputation.eolian_standing + 15),
          university_social: clamp(state.reputation.university_social + 2)
        },
        fatigue: clamp(state.fatigue + 5),
        hunger: clamp(state.hunger + 2),
        eolian_state: {
          ...state.eolian_state,
          has_talent_pipes: true,
          last_audition_day: state.day_number
        }
      }
    };
  }

  return {
    message: EOLIAN_AUDITION_FAIL[dialogueIndex(state)],
    newState: {
      ...state,
      reputation: {
        ...state.reputation,
        eolian_standing: clamp(state.reputation.eolian_standing + 1)
      },
      fatigue: clamp(state.fatigue + 4),
      hunger: clamp(state.hunger + 2),
      eolian_state: {
        ...state.eolian_state,
        last_audition_day: state.day_number
      }
    }
  };
}

export function playAtEolian(
  state: PlayerState,
  db: InstanceType<typeof Database>
): { message: string; newState: PlayerState } {
  void db;

  if (state.location_id !== 'eolian_floor') {
    return {
      message: 'This is not the place for that sort of performance.',
      newState: state
    };
  }

  if (!canEnterEolian(state)) {
    return {
      message: EOLIAN_NOT_OPEN_LINES[dialogueIndex(state)],
      newState: state
    };
  }

  if (!state.eolian_state.has_talent_pipes) {
    return {
      message: 'The Eolian does not grant that privilege to every player.',
      newState: state
    };
  }

  if (state.eolian_state.performances_today > 0) {
    return {
      message: 'One turn before the room is enough for tonight.',
      newState: state
    };
  }

  if (!isLutePresent(state)) {
    return {
      message: 'You have nothing in hand fit for the room.',
      newState: state
    };
  }

  const advancedState = advanceTime(state, 1);

  return {
    message: EOLIAN_PLAY_LINES[dialogueIndex(state)],
    newState: {
      ...advancedState,
      reputation: {
        ...advancedState.reputation,
        eolian_standing: clamp(advancedState.reputation.eolian_standing + 2),
        university_social: clamp(advancedState.reputation.university_social + 1)
      },
      fatigue: clamp(advancedState.fatigue + 10),
      hunger: clamp(advancedState.hunger + 5),
      eolian_state: {
        ...advancedState.eolian_state,
        performances_today: advancedState.eolian_state.performances_today + 1
      }
    }
  };
}
