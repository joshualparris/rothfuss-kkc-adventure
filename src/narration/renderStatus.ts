import type { PlayerState } from '../types';

export function formatCurrency(drabs: number): string {
  if (drabs <= 0) {
    return 'nothing';
  }

  const talents = Math.floor(drabs / 100);
  const remainingAfterTalents = drabs % 100;
  const jots = Math.floor(remainingAfterTalents / 10);
  const remainingDrabs = remainingAfterTalents % 10;
  const parts: string[] = [];

  if (talents > 0) {
    parts.push(`${talents} ${talents === 1 ? 'talent' : 'talents'}`);
  }

  if (jots > 0) {
    parts.push(`${jots} ${jots === 1 ? 'jot' : 'jots'}`);
  }

  if (remainingDrabs > 0) {
    parts.push(`${remainingDrabs} ${remainingDrabs === 1 ? 'drab' : 'drabs'}`);
  }

  return parts.join(', ');
}

export function hungerLabel(hunger: number): string {
  if (hunger <= 20) {
    return 'well-fed';
  }

  if (hunger <= 50) {
    return 'peckish';
  }

  if (hunger <= 80) {
    return 'hungry';
  }

  return 'starving';
}

export function fatigueLabel(fatigue: number): string {
  if (fatigue <= 20) {
    return 'rested';
  }

  if (fatigue <= 50) {
    return 'tired';
  }

  if (fatigue <= 80) {
    return 'weary';
  }

  return 'exhausted';
}

export function alarLabel(alar_strength: number): string {
  if (alar_strength >= 80) {
    return 'sharp';
  }

  if (alar_strength >= 50) {
    return 'steady';
  }

  if (alar_strength >= 30) {
    return 'strained';
  }

  if (alar_strength >= 10) {
    return 'fragile';
  }

  return 'broken';
}

export function warmthLabel(warmth: number): string {
  if (warmth >= 80) {
    return 'warm';
  }

  if (warmth >= 60) {
    return 'comfortable';
  }

  if (warmth >= 40) {
    return 'cool';
  }

  if (warmth >= 20) {
    return 'cold';
  }

  return 'dangerously cold';
}

export function renderStatus(state: PlayerState): string {
  const tuitionStatus = state.tuition_state.paid
    ? 'paid'
    : state.tuition_state.overdue
      ? 'overdue'
      : 'unpaid';
  const lines = [
    `Character: ${state.character_id} (${state.era})`,
    `Current location: ${state.location_id}`,
    `Money: ${formatCurrency(state.money_drabs)}`,
    `Academic rank: ${state.academic_rank}`,
    `Tuition: ${formatCurrency(state.tuition_state.amount_drabs)} due by day ${state.tuition_state.due_on_day} (${tuitionStatus})`,
    `Time: ${state.time_of_day}, Day ${state.day_number}, Term ${state.term_number}`,
    `Hunger: ${hungerLabel(state.hunger)}`,
    `Fatigue: ${fatigueLabel(state.fatigue)}`,
    `Alar: ${alarLabel(state.sympathy_state.alar_strength)}`,
    `Warmth: ${warmthLabel(state.warmth)}`
  ];

  if (state.injuries.length > 0) {
    lines.push(`Injuries: ${state.injuries.join(', ')}`);
  }

  return lines.join('\n');
}

export function renderInventory(state: PlayerState): string {
  if (state.inventory.length === 0) {
    return 'You are carrying nothing of note.';
  }

  return state.inventory
    .map((item) => {
      const noteText = item.notes ? ` (${item.notes})` : '';
      return `- ${item.name} x${item.quantity}${noteText}`;
    })
    .join('\n');
}
