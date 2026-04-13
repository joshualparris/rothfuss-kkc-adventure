import type { PlayerState, TimeOfDay } from '../types';

const TIME_SEQUENCE: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];

export function advanceTime(state: PlayerState, steps: number = 1): PlayerState {
  let nextTime = state.time_of_day;
  let nextDay = state.day_number;
  let nextHunger = state.hunger;
  let nextFatigue = state.fatigue;
  let nextWarmth = state.sympathy_state.warmth;
  let nextAlar = state.sympathy_state.alar_strength;
  let nextFisheryState = state.fishery_state;
  let nextEolianState = state.eolian_state;

  for (let step = 0; step < steps; step += 1) {
    const currentIndex = TIME_SEQUENCE.indexOf(nextTime);
    const followingTime = TIME_SEQUENCE[(currentIndex + 1) % TIME_SEQUENCE.length];

    if (nextTime === 'night' && followingTime === 'morning') {
      nextDay += 1;
      nextFisheryState = {
        ...nextFisheryState,
        approved_today: false,
        shifts_completed_today: 0
      };
      nextEolianState = {
        ...nextEolianState,
        performances_today: 0
      };
    }

    nextTime = followingTime;
    nextHunger = Math.min(100, nextHunger + 8);
    nextFatigue = Math.min(100, nextFatigue + 6);
    nextWarmth = Math.min(
      100,
      nextWarmth + (state.sympathy_state.times_used_today === 0 ? 3 : 1)
    );
    nextAlar = Math.min(100, nextAlar + 4);
  }

  return {
    ...state,
    time_of_day: nextTime,
    day_number: nextDay,
    hunger: nextHunger,
    fatigue: nextFatigue,
    warmth: nextWarmth,
    sympathy_state: {
      ...state.sympathy_state,
      warmth: nextWarmth,
      alar_strength: nextAlar
    },
    fishery_state: nextFisheryState,
    eolian_state: nextEolianState
  };
}

export function timeLabel(time: TimeOfDay): string {
  if (time === 'morning') {
    return 'the early morning';
  }

  if (time === 'afternoon') {
    return 'the afternoon';
  }

  if (time === 'evening') {
    return 'the evening';
  }

  return 'deep in the night';
}
