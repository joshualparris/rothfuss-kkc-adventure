import {
  busk,
  checkTuitionDeadline,
  eat,
  payTuition,
  sleep
} from '../src/engine/economy';
import { initDefaultPlayerState } from '../src/engine/state';

describe('economy', () => {
  test('eat with sufficient funds deducts 3 drabs and reduces hunger', () => {
    const state = {
      ...initDefaultPlayerState(),
      hunger: 50,
      money_drabs: 10
    };
    const result = eat(state);

    expect(result.newState.money_drabs).toBe(7);
    expect(result.newState.hunger).toBe(10);
  });

  test('eat with 0 drabs returns failure message and unchanged state', () => {
    const state = {
      ...initDefaultPlayerState(),
      money_drabs: 0
    };
    const result = eat(state);

    expect(result.newState).toBe(state);
    expect(result.message).toBe("You haven't the coin for even a modest meal.");
  });

  test('sleep at university_mews_room sets fatigue to 0 and does not deduct drabs', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_mews_room',
      fatigue: 70,
      hunger: 40,
      money_drabs: 35
    };
    const result = sleep(state);

    expect(result.newState.fatigue).toBe(0);
    expect(result.newState.money_drabs).toBe(35);
  });

  test('sleep at university_mains returns failure message', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_mains'
    };
    const result = sleep(state);

    expect(result.newState).toBe(state);
    expect(result.message).toBe('You need somewhere to actually sleep.');
  });

  test("busk at university_ankers adds drabs to money_drabs", () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_ankers',
      money_drabs: 10
    };
    const result = busk(state);

    expect(result.newState.money_drabs).toBeGreaterThan(10);
  });

  test('busk at university_mains returns failure message', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_mains'
    };
    const result = busk(state);

    expect(result.newState).toBe(state);
    expect(result.message).toBe("There's nowhere to play for coin here.");
  });

  test('payTuition with sufficient funds sets tuition_state.paid to true', () => {
    const state = {
      ...initDefaultPlayerState(),
      money_drabs: 60
    };
    const result = payTuition(state);

    expect(result.newState.tuition_state.paid).toBe(true);
  });

  test('payTuition with insufficient funds returns failure message', () => {
    const state = {
      ...initDefaultPlayerState(),
      money_drabs: 5
    };
    const result = payTuition(state);

    expect(result.newState).toBe(state);
    expect(result.message).toBe("You don't have enough.");
  });

  test('checkTuitionDeadline sets overdue when day_number >= due_on_day and paid is false', () => {
    const state = {
      ...initDefaultPlayerState(),
      day_number: 14
    };
    const result = checkTuitionDeadline(state);

    expect(result.tuition_state.overdue).toBe(true);
  });

  test('checkTuitionDeadline does not set overdue when already paid', () => {
    const state = {
      ...initDefaultPlayerState(),
      day_number: 14,
      tuition_state: {
        ...initDefaultPlayerState().tuition_state,
        paid: true
      }
    };
    const result = checkTuitionDeadline(state);

    expect(result.tuition_state.overdue).toBe(false);
  });
});
