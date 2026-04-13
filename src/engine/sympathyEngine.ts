import type { InventoryItem, PlayerState, SympathyAttempt, SympathyOutcome, SympathyResult } from '../types';

type MaterialId =
  | 'candle_tallow'
  | 'wicking'
  | 'iron_drab'
  | 'clay_lump'
  | 'pine_pitch'
  | 'wax_stub';

type MaterialCategory = 'metal' | 'wax' | 'cord' | 'organic' | 'other';

interface MaterialDefinition {
  id: MaterialId;
  name: string;
  notes: string;
  category: MaterialCategory;
}

const MATERIALS: Record<MaterialId, MaterialDefinition> = {
  candle_tallow: {
    id: 'candle_tallow',
    name: 'tallow candle',
    notes: 'Basic sympathetic binding material.',
    category: 'wax'
  },
  wicking: {
    id: 'wicking',
    name: 'wicking cord',
    notes: 'For use in sympathy preparations.',
    category: 'cord'
  },
  iron_drab: {
    id: 'iron_drab',
    name: 'iron drab',
    notes: 'A common coin, useful for crude metal bindings.',
    category: 'metal'
  },
  clay_lump: {
    id: 'clay_lump',
    name: 'clay lump',
    notes: 'A modest lump of clay for simple demonstrations.',
    category: 'organic'
  },
  pine_pitch: {
    id: 'pine_pitch',
    name: 'pine pitch',
    notes: "A small pot of pitch, useful for preparation and concentration tricks.",
    category: 'organic'
  },
  wax_stub: {
    id: 'wax_stub',
    name: 'wax stub',
    notes: 'A melted candle remnant suited to basic bindings.',
    category: 'wax'
  }
};

export const MATERIAL_PRICES: Record<MaterialId, number> = {
  candle_tallow: 2,
  wicking: 3,
  iron_drab: 1,
  clay_lump: 2,
  pine_pitch: 4,
  wax_stub: 1
};

const VALID_SYMPATHY_MATERIALS = new Set<MaterialId>(Object.keys(MATERIALS) as MaterialId[]);

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeMaterialName(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ');
}

function getMaterialCategory(itemId: string): MaterialCategory {
  return MATERIALS[itemId as MaterialId]?.category ?? 'other';
}

function hasInventoryItem(inventory: InventoryItem[], itemId: string): boolean {
  return inventory.some((item) => item.id === itemId && item.quantity > 0);
}

function getInventoryItemIndex(inventory: InventoryItem[], itemId: string): number {
  return inventory.findIndex((item) => item.id === itemId);
}

function toDisplayName(itemId: MaterialId, quantity: number): string {
  const name = MATERIALS[itemId].name;

  if (quantity === 1) {
    return name;
  }

  if (itemId === 'pine_pitch') {
    return 'small pots of pine pitch';
  }

  if (itemId === 'wicking') {
    return 'lengths of wicking cord';
  }

  if (name.endsWith('y')) {
    return `${name.slice(0, -1)}ies`;
  }

  return `${name}s`;
}

export function resolveMaterialId(input: string): MaterialId | null {
  const normalizedInput = normalizeMaterialName(input);
  const materialIds = Object.keys(MATERIALS) as MaterialId[];

  for (const materialId of materialIds) {
    const normalizedId = normalizeMaterialName(materialId);
    const normalizedName = normalizeMaterialName(MATERIALS[materialId].name);

    if (
      normalizedInput === normalizedId ||
      normalizedInput === normalizedName ||
      normalizedId.includes(normalizedInput) ||
      normalizedName.includes(normalizedInput)
    ) {
      return materialId;
    }
  }

  return null;
}

export function getSimilarityScore(
  source_item_id: string,
  target_item_id: string
): number {
  if (source_item_id === target_item_id) {
    return 1.0;
  }

  const sourceCategory = getMaterialCategory(source_item_id);
  const targetCategory = getMaterialCategory(target_item_id);

  if (sourceCategory === 'metal' && targetCategory === 'metal') {
    return 0.7;
  }

  if (sourceCategory === 'wax' && targetCategory === 'wax') {
    return 0.65;
  }

  if (
    (sourceCategory === 'wax' && targetCategory === 'cord') ||
    (sourceCategory === 'cord' && targetCategory === 'wax')
  ) {
    return 0.3;
  }

  if (
    (sourceCategory === 'metal' && targetCategory === 'organic') ||
    (sourceCategory === 'organic' && targetCategory === 'metal')
  ) {
    return 0.15;
  }

  return 0.1;
}

export function calculateHeatCost(similarity: number, alar_strength: number): number {
  const base_cost = 15;
  const efficiency_reduction = Math.floor(similarity * 10);
  const alar_modifier = alar_strength < 40 ? 5 : 0;

  return clamp(base_cost - efficiency_reduction + alar_modifier, 3, 25);
}

export function calculateRisk(state: PlayerState, similarity: number): number {
  let base_risk = 20;

  if (state.warmth < 30) {
    base_risk += 30;
  }

  if (state.warmth < 50) {
    base_risk += 15;
  }

  if (state.fatigue > 70) {
    base_risk += 15;
  }

  if (state.hunger > 70) {
    base_risk += 10;
  }

  if (state.sympathy_state.alar_strength < 30) {
    base_risk += 25;
  }

  if (state.sympathy_state.times_used_today >= 3) {
    base_risk += 20;
  }

  if (similarity < 0.2) {
    base_risk += 20;
  }

  if (similarity >= 0.6) {
    base_risk -= 10;
  }

  return clamp(base_risk, 5, 95);
}

export function resolveOutcome(risk: number, state: PlayerState): SympathyOutcome {
  const seed =
    (state.sympathy_state.times_used_today * 17 +
      state.day_number * 7 +
      Math.floor(state.warmth) +
      Math.floor(state.sympathy_state.alar_strength)) %
    100;

  if (seed >= risk) {
    return 'success';
  }

  if (seed >= risk - 20) {
    return 'slip';
  }

  if (seed >= risk - 40) {
    return 'bleedthrough';
  }

  return 'backlash';
}

export function adjudicate(
  attempt: SympathyAttempt,
  state: PlayerState
): SympathyResult {
  const hasSource = hasInventoryItem(state.inventory, attempt.source_item_id);
  const hasTarget =
    VALID_SYMPATHY_MATERIALS.has(attempt.target_item_id as MaterialId) ||
    hasInventoryItem(state.inventory, attempt.target_item_id);

  if (!hasSource) {
    return {
      outcome: 'blocked',
      heat_cost: 0,
      alar_cost: 0,
      injury: null,
      narration_key: 'no_source_material',
      state_changes: {}
    };
  }

  if (!hasTarget) {
    return {
      outcome: 'blocked',
      heat_cost: 0,
      alar_cost: 0,
      injury: null,
      narration_key: 'invalid_target',
      state_changes: {}
    };
  }

  if (state.sympathy_state.alar_strength < 10) {
    return {
      outcome: 'blocked',
      heat_cost: 0,
      alar_cost: 0,
      injury: null,
      narration_key: 'alar_broken',
      state_changes: {}
    };
  }

  if (state.warmth < 10) {
    return {
      outcome: 'blocked',
      heat_cost: 0,
      alar_cost: 0,
      injury: null,
      narration_key: 'too_cold',
      state_changes: {}
    };
  }

  const similarity = getSimilarityScore(attempt.source_item_id, attempt.target_item_id);
  const heat_cost = calculateHeatCost(similarity, state.sympathy_state.alar_strength);
  const risk = calculateRisk(state, similarity);
  const outcome = resolveOutcome(risk, state);

  if (outcome === 'success') {
    return {
      outcome,
      heat_cost,
      alar_cost: 5,
      injury: null,
      narration_key: 'success',
      state_changes: {
        warmth: clamp(state.sympathy_state.warmth - heat_cost, 0, 100),
        alar_strength: clamp(state.sympathy_state.alar_strength - 5, 0, 100),
        times_used_today: state.sympathy_state.times_used_today + 1
      }
    };
  }

  if (outcome === 'slip') {
    return {
      outcome,
      heat_cost,
      alar_cost: 10,
      injury: null,
      narration_key: 'slip',
      state_changes: {
        warmth: clamp(state.sympathy_state.warmth - Math.floor(heat_cost / 2), 0, 100),
        alar_strength: clamp(state.sympathy_state.alar_strength - 10, 0, 100),
        times_used_today: state.sympathy_state.times_used_today + 1
      }
    };
  }

  if (outcome === 'bleedthrough') {
    return {
      outcome,
      heat_cost,
      alar_cost: 15,
      injury: 'minor sympathetic bleedthrough - sensation in hands',
      narration_key: 'bleedthrough',
      state_changes: {
        warmth: clamp(state.sympathy_state.warmth - heat_cost, 0, 100),
        alar_strength: clamp(state.sympathy_state.alar_strength - 15, 0, 100),
        times_used_today: state.sympathy_state.times_used_today + 1
      }
    };
  }

  return {
    outcome,
    heat_cost,
    alar_cost: 25,
    injury: 'sympathetic backlash - muscle spasm, pain in chest',
    narration_key: 'backlash',
    state_changes: {
      warmth: clamp(state.sympathy_state.warmth - heat_cost * 2, 0, 100),
      alar_strength: clamp(state.sympathy_state.alar_strength - 25, 0, 100),
      times_used_today: state.sympathy_state.times_used_today + 1
    }
  };
}

export function applySympatbyResult(
  state: PlayerState,
  result: SympathyResult
): PlayerState {
  const nextSympathyState = {
    ...state.sympathy_state,
    ...result.state_changes
  };

  return {
    ...state,
    warmth: nextSympathyState.warmth,
    sympathy_state: nextSympathyState,
    injuries: result.injury ? [...state.injuries, result.injury] : state.injuries
  };
}

export function buyMaterial(
  item_id: string,
  quantity: number,
  state: PlayerState
): { newState: PlayerState; message: string } {
  const materialId = resolveMaterialId(item_id);
  const safeQuantity = quantity > 0 ? quantity : 1;

  if (state.location_id !== 'university_fishery_outer') {
    return {
      newState: state,
      message: "Kilvin's students sell materials, but you're not in the Fishery."
    };
  }

  if (!materialId) {
    return {
      newState: state,
      message: "That's not something you can buy here."
    };
  }

  const totalCost = MATERIAL_PRICES[materialId] * safeQuantity;

  if (state.money_drabs < totalCost) {
    return {
      newState: state,
      message: "You haven't the coin for that."
    };
  }

  const nextInventory = state.inventory.map((item) => ({ ...item }));
  const existingIndex = getInventoryItemIndex(nextInventory, materialId);

  if (existingIndex >= 0) {
    nextInventory[existingIndex] = {
      ...nextInventory[existingIndex],
      quantity: nextInventory[existingIndex].quantity + safeQuantity
    };
  } else {
    nextInventory.push({
      id: materialId,
      name: MATERIALS[materialId].name,
      quantity: safeQuantity,
      notes: MATERIALS[materialId].notes
    });
  }

  return {
    newState: {
      ...state,
      money_drabs: state.money_drabs - totalCost,
      inventory: nextInventory
    },
    message: `You buy ${safeQuantity} ${toDisplayName(materialId, safeQuantity)}.`
  };
}

export function parseSympathyCommand(input: string): SympathyAttempt | null {
  const trimmedInput = input.trim();
  const simpleMatch = trimmedInput.match(/^use sympathy$/i);

  if (simpleMatch) {
    return {
      source_item_id: 'candle_tallow',
      target_item_id: 'candle_tallow',
      intent: 'basic binding'
    };
  }

  const intentMatch = trimmedInput.match(/^use sympathy to\s+(.+)$/i);

  if (intentMatch) {
    return {
      source_item_id: 'candle_tallow',
      target_item_id: 'candle_tallow',
      intent: intentMatch[1].trim().toLowerCase()
    };
  }

  const bindMatch = trimmedInput.match(/^bind\s+(.+?)\s+to\s+(.+)$/i);

  if (bindMatch) {
    const sourceItemId = resolveMaterialId(bindMatch[1]);
    const targetItemId = resolveMaterialId(bindMatch[2]);

    if (!sourceItemId || !targetItemId) {
      return null;
    }

    return {
      source_item_id: sourceItemId,
      target_item_id: targetItemId,
      intent: 'basic binding'
    };
  }

  return null;
}
