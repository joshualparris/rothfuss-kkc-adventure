import type { NarrationSceneContext } from '../types';
import { GEMINI_NARRATION_INSTRUCTIONS } from './canonInstructions';

function buildAuthoritativeConstraints(): string[] {
  return [
    'Authoritative Constraints:',
    '- Only mention visible NPCs.',
    '- Only describe exits from the supplied accessible directions.',
    '- Do not invent lore or resolve mysteries beyond what is given.',
    '- Honour engine_truth exactly and do not narrate outcomes that differ from it.',
    '- Keep prose restrained, present tense, second person.'
  ];
}

export function buildGeminiSystemPrompt(context: NarrationSceneContext): string {
  const lines = [
    GEMINI_NARRATION_INSTRUCTIONS,
    '',
    'Grounded Scene Context:',
    `Era: ${context.canon_era_context.era_label}`,
    `Location group: ${context.canon_era_context.location_group}`,
    ...context.canon_era_context.notes.map((note) => `- ${note}`),
    '',
    'Canon Ground Truth:',
    ...context.canon_registry_facts.map((fact) => `- ${fact}`),
    '',
    ...buildAuthoritativeConstraints()
  ];

  return lines.filter(Boolean).join('\n');
}

function formatConditionSummary(context: NarrationSceneContext): string {
  const parts = [
    `Hunger: ${context.player_summary.hunger_label}`,
    `Fatigue: ${context.player_summary.fatigue_label}`
  ];

  if (context.player_summary.warmth_label) {
    parts.push(`Warmth: ${context.player_summary.warmth_label}`);
  }

  if (context.player_summary.injury_summary) {
    parts.push(`Injuries: ${context.player_summary.injury_summary}`);
  }

  return parts.join(', ');
}

export function buildGeminiUserPrompt(context: NarrationSceneContext): string {
  const visibleExits = context.location_summary.exits.length
    ? context.location_summary.exits.join(', ')
    : 'none';
  const visiblePeople = context.npc_summary.names.length
    ? context.npc_summary.names.join(', ')
    : 'none';
  const inventoryLine = context.inventory_summary.item_names.length
    ? context.inventory_summary.item_names.join(', ')
    : 'nothing of note';

  const lines = [
    `Command: ${context.command}`,
    `Location: ${context.location_summary.name}`,
    `Description: ${context.location_summary.description_base}`,
    `Time: ${context.player_summary.time_of_day}, Day ${context.player_summary.day_number}`,
    `Visible exits: ${visibleExits}`,
    `Visible people: ${visiblePeople}`,
    `Money: ${context.inventory_summary.money_display}`,
    `Inventory: ${inventoryLine}`,
    `Academic rank: ${context.player_summary.academic_rank}`,
    context.player_summary.social_standing_label,
    `Conditions: ${formatConditionSummary(context)}`
  ];

  if (
    context.engine_truth.movement_message ||
    context.engine_truth.sympathy_outcome ||
    context.engine_truth.social_outcome ||
    context.engine_truth.music_outcome
  ) {
    lines.push('Engine truth:');
    if (context.engine_truth.movement_message) {
      lines.push(`- ${context.engine_truth.movement_message}`);
    }
    if (context.engine_truth.sympathy_outcome) {
      lines.push(`- ${context.engine_truth.sympathy_outcome}`);
    }
    if (context.engine_truth.social_outcome) {
      lines.push(`- ${context.engine_truth.social_outcome}`);
    }
    if (context.engine_truth.music_outcome) {
      lines.push(`- ${context.engine_truth.music_outcome}`);
    }
  }

  lines.push('', 'Write the scene now.');

  return lines.filter(Boolean).join('\n');
}
