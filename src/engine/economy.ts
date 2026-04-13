import { advanceTime } from './time';
import type { PlayerState } from '../types';

function clampMinimum(value: number): number {
  return Math.max(0, value);
}

export function eat(state: PlayerState): { newState: PlayerState; message: string } {
  if (state.money_drabs < 3) {
    return {
      newState: state,
      message: "You haven't the coin for even a modest meal."
    };
  }

  return {
    newState: {
      ...state,
      money_drabs: state.money_drabs - 3,
      hunger: clampMinimum(state.hunger - 40)
    },
    message: 'You eat something plain and filling.'
  };
}

export function sleep(state: PlayerState): { newState: PlayerState; message: string } {
  const canSleepHere =
    state.location_id === 'university_ankers' || state.location_id === 'university_mews_room';

  if (!canSleepHere) {
    return {
      newState: state,
      message: 'You need somewhere to actually sleep.'
    };
  }

  if (state.location_id === 'university_ankers' && state.money_drabs < 20) {
    return {
      newState: state,
      message: "You can't afford the room tonight."
    };
  }

  const advancedState = advanceTime(state, 2);
  const roomCost = state.location_id === 'university_ankers' ? 20 : 0;

  return {
    newState: {
      ...advancedState,
      money_drabs: advancedState.money_drabs - roomCost,
      fatigue: 0,
      hunger: clampMinimum(advancedState.hunger - 20),
      warmth: Math.max(advancedState.warmth, 75),
      sympathy_state: {
        ...advancedState.sympathy_state,
        warmth: Math.max(advancedState.sympathy_state.warmth, 75),
        alar_strength: Math.max(advancedState.sympathy_state.alar_strength, 80),
        times_used_today: 0
      },
      fishery_state: {
        ...advancedState.fishery_state,
        approved_today: false,
        shifts_completed_today: 0
      },
      eolian_state: {
        ...advancedState.eolian_state,
        performances_today: 0
      }
    },
    message: 'You lie down at last and wake some hours later with your thoughts less frayed.'
  };
}

export function busk(state: PlayerState): { newState: PlayerState; message: string } {
  if (state.location_id !== 'university_ankers') {
    return {
      newState: state,
      message: "There's nowhere to play for coin here."
    };
  }

  let earnings = 5;

  if (state.reputation.eolian_standing >= 40) {
    earnings += 3;
  }

  if (state.reputation.university_social >= 50) {
    earnings += 2;
  }

  if (state.fatigue >= 60) {
    earnings = Math.max(1, earnings - 2);
  }

  if (state.hunger >= 70) {
    earnings = Math.max(1, earnings - 1);
  }

  const advancedState = advanceTime(state);
  const messagePool = [
    `You play for two hours. People leave coins on the edge of the bar. ${earnings} drabs in all.`,
    `You give the room what music it will take. By the time you stop, ${earnings} drabs lie waiting for you.`,
    `You play until the last tune has worn thin at the edges. When it is done, there are ${earnings} drabs to gather.`
  ];

  return {
    newState: {
      ...advancedState,
      money_drabs: advancedState.money_drabs + earnings,
      reputation: {
        ...advancedState.reputation,
        eolian_standing: Math.min(100, advancedState.reputation.eolian_standing + 1)
      }
    },
    message: messagePool[state.day_number % 3]
  };
}

export function checkTuitionDeadline(state: PlayerState): PlayerState {
  if (
    state.day_number >= state.tuition_state.due_on_day &&
    state.tuition_state.paid === false &&
    state.tuition_state.overdue === false
  ) {
    return {
      ...state,
      tuition_state: {
        ...state.tuition_state,
        overdue: true
      }
    };
  }

  return state;
}

export function payTuition(state: PlayerState): { newState: PlayerState; message: string } {
  if (state.tuition_state.paid) {
    return {
      newState: state,
      message: 'Your tuition is already settled.'
    };
  }

  if (state.money_drabs < state.tuition_state.amount_drabs) {
    return {
      newState: state,
      message: "You don't have enough."
    };
  }

  return {
    newState: {
      ...state,
      money_drabs: state.money_drabs - state.tuition_state.amount_drabs,
      tuition_state: {
        ...state.tuition_state,
        paid: true
      }
    },
    message: 'You pay your tuition. The weight of it leaves you.'
  };
}
