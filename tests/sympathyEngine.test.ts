import {
  adjudicate,
  applySympatbyResult,
  buyMaterial,
  calculateHeatCost,
  calculateRisk,
  getSimilarityScore,
  resolveOutcome
} from '../src/engine/sympathyEngine';
import { initDefaultPlayerState } from '../src/engine/state';

describe('sympathyEngine', () => {
  test("getSimilarityScore returns 1.0 for identical iron drabs", () => {
    expect(getSimilarityScore('iron_drab', 'iron_drab')).toBe(1.0);
  });

  test('getSimilarityScore returns 0.65 for candle_tallow and wax_stub', () => {
    expect(getSimilarityScore('candle_tallow', 'wax_stub')).toBe(0.65);
  });

  test('getSimilarityScore returns 0.15 for iron_drab and clay_lump', () => {
    expect(getSimilarityScore('iron_drab', 'clay_lump')).toBe(0.15);
  });

  test('high similarity produces lower heat cost than low similarity', () => {
    expect(calculateHeatCost(0.9, 70)).toBeLessThan(calculateHeatCost(0.1, 70));
  });

  test('weak alar produces higher heat cost than strong alar', () => {
    expect(calculateHeatCost(0.5, 30)).toBeGreaterThan(calculateHeatCost(0.5, 70));
  });

  test('cold state produces higher risk than warm state', () => {
    const coldState = {
      ...initDefaultPlayerState(),
      warmth: 20,
      sympathy_state: {
        ...initDefaultPlayerState().sympathy_state,
        warmth: 20
      }
    };
    const warmState = {
      ...initDefaultPlayerState(),
      warmth: 80,
      sympathy_state: {
        ...initDefaultPlayerState().sympathy_state,
        warmth: 80
      }
    };

    expect(calculateRisk(coldState, 0.5)).toBeGreaterThan(calculateRisk(warmState, 0.5));
  });

  test('high fatigue produces higher risk than low fatigue', () => {
    const tiredState = {
      ...initDefaultPlayerState(),
      fatigue: 90
    };
    const restedState = {
      ...initDefaultPlayerState(),
      fatigue: 10
    };

    expect(calculateRisk(tiredState, 0.5)).toBeGreaterThan(calculateRisk(restedState, 0.5));
  });

  test('resolveOutcome is deterministic for the same state', () => {
    const state = initDefaultPlayerState();

    expect(resolveOutcome(40, state)).toBe(resolveOutcome(40, state));
  });

  test("resolveOutcome returns success for a very low risk state", () => {
    expect(resolveOutcome(5, initDefaultPlayerState())).toBe('success');
  });

  test('adjudicate blocks when source material is missing', () => {
    const state = initDefaultPlayerState();
    const result = adjudicate(
      {
        source_item_id: 'iron_drab',
        target_item_id: 'iron_drab',
        intent: 'basic binding'
      },
      state
    );

    expect(result.outcome).toBe('blocked');
    expect(result.narration_key).toBe('no_source_material');
  });

  test('adjudicate succeeds with valid materials and healthy default state', () => {
    const state = initDefaultPlayerState();
    const result = adjudicate(
      {
        source_item_id: 'candle_tallow',
        target_item_id: 'candle_tallow',
        intent: 'basic binding'
      },
      state
    );

    expect(result.outcome).toBe('success');
  });

  test('adjudicate blocks when warmth is too low', () => {
    const state = {
      ...initDefaultPlayerState(),
      warmth: 5,
      sympathy_state: {
        ...initDefaultPlayerState().sympathy_state,
        warmth: 5
      }
    };
    const result = adjudicate(
      {
        source_item_id: 'candle_tallow',
        target_item_id: 'candle_tallow',
        intent: 'basic binding'
      },
      state
    );

    expect(result.outcome).toBe('blocked');
    expect(result.narration_key).toBe('too_cold');
  });

  test('successful adjudication returns a heat cost above zero', () => {
    const state = initDefaultPlayerState();
    const result = adjudicate(
      {
        source_item_id: 'candle_tallow',
        target_item_id: 'candle_tallow',
        intent: 'basic binding'
      },
      state
    );

    expect(result.heat_cost).toBeGreaterThan(0);
  });

  test('applySympatbyResult lowers warmth after a success', () => {
    const state = initDefaultPlayerState();
    const result = adjudicate(
      {
        source_item_id: 'candle_tallow',
        target_item_id: 'candle_tallow',
        intent: 'basic binding'
      },
      state
    );
    const updatedState = applySympatbyResult(state, result);

    expect(updatedState.warmth).toBeLessThan(state.warmth);
  });

  test('applySympatbyResult appends an injury after backlash', () => {
    const state = initDefaultPlayerState();
    const updatedState = applySympatbyResult(state, {
      outcome: 'backlash',
      heat_cost: 20,
      alar_cost: 25,
      injury: 'sympathetic backlash - muscle spasm, pain in chest',
      narration_key: 'backlash',
      state_changes: {
        warmth: 0,
        alar_strength: 0,
        times_used_today: 1
      }
    });

    expect(updatedState.injuries.length).toBeGreaterThan(0);
  });

  test('buyMaterial deducts correct drabs at the Fishery', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_fishery_outer',
      money_drabs: 10
    };
    const result = buyMaterial('candle_tallow', 1, state);

    expect(result.newState.money_drabs).toBe(8);
  });

  test('buyMaterial fails at the wrong location', () => {
    const state = initDefaultPlayerState();
    const result = buyMaterial('candle_tallow', 1, state);

    expect(result.newState).toBe(state);
    expect(result.message).toBe("Kilvin's students sell materials, but you're not in the Fishery.");
  });

  test('buyMaterial fails when funds are insufficient', () => {
    const state = {
      ...initDefaultPlayerState(),
      location_id: 'university_fishery_outer',
      money_drabs: 1
    };
    const result = buyMaterial('candle_tallow', 1, state);

    expect(result.newState).toBe(state);
    expect(result.message).toBe("You haven't the coin for that.");
  });
});
