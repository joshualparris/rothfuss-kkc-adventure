import type { Exit, InventoryItem, Location, NPC, NarrationSceneContext, PlayerState } from '../types';
import { formatCurrency } from './renderStatus';
import { getRelevantCanonFacts } from '../content/canonRegistry';

function formatInventoryName(item: InventoryItem): string {
  return item.quantity > 1 ? `${item.name} x${item.quantity}` : item.name;
}

function getHungerLabel(hunger: number): string {
  if (hunger <= 2) return 'You feel sharp and alert.';
  if (hunger <= 5) return 'A weight sits behind your eyes.';
  return 'Your thoughts move like thick honey.';
}

function getFatigueLabel(fatigue: number): string {
  if (fatigue <= 2) return 'You feel sharp and alert.';
  if (fatigue <= 5) return 'A weight sits behind your eyes.';
  return 'Your thoughts move like thick honey.';
}

function getWarmthLabel(warmth: number): string {
  if (warmth >= 80) return 'You are comfortably warm.';
  if (warmth >= 50) return 'You are cool, but not unpleasantly so.';
  if (warmth >= 20) return 'You are cold, and shiver occasionally.';
  return 'You are dangerously cold, and your teeth chatter.';
}

function getInjurySummary(injuries: string[]): string | undefined {
  if (injuries.length === 0) return undefined;
  return `You are suffering from: ${injuries.join(', ')}.`;
}

function getSocialStandingLabel(state: PlayerState, location: Location): string | undefined {
  if (location.cluster_id === 'university') {
    if (state.reputation.academic_standing >= 80) return 'You are a respected student at the University.';
    if (state.reputation.academic_standing >= 50) return 'You are an ordinary student at the University.';
    return 'You are a struggling student at the University.';
  }
  if (location.cluster_id === 'imre' || location.cluster_id === 'eolian') {
    if (state.reputation.eolian_standing >= 80) return 'You are well-known at the Eolian.';
    if (state.reputation.eolian_standing >= 50) return 'You are quietly better known in Imre.';
    return 'You are not yet known at the Eolian.';
  }
  return undefined;
}

const SUPPORTED_SCENE_COMMANDS = new Set([
  'look',
  'look around',
  'go',
  'wait',
  'use sympathy',
  'bind',
  'ask kilvin for work',
  'work fishery',
  'work at fishery',
  'ignore ambrose',
  'answer ambrose carefully',
  'answer ambrose sharply',
  'audition for pipes',
  'play at eolian',
]);

function buildCanonEraContext(location: Location): NarrationSceneContext['canon_era_context'] {
  const eraLabel = `${location.era.charAt(0).toUpperCase()}${location.era.slice(1)} era`;
  let locationGroup = 'Unknown';
  let notes: string[] = [];

  switch (location.cluster_id) {
    case 'university':
      locationGroup = 'University';
      notes = [
        "This is Kvothe's student period at the University.",
        'Money, rank, and reputation matter here.',
        'Sympathy is trained and costly, not casual.',
        'Access to places may depend on standing or time.'
      ];
      break;
    case 'river_crossing':
      locationGroup = 'River crossing';
      notes = [
        'This is the route between the University and Imre.',
        'Crossing takes meaningful time in lived experience.',
        'Public movement and social visibility matter.'
      ];
      break;
    case 'imre':
    case 'eolian':
      locationGroup = 'Imre';
      notes = [
        'Imre is distinct from the University in mood and social texture.',
        'The Eolian is a reputation-bearing music venue.',
        'Talent pipes must be earned.',
        'This is a public social environment.'
      ];
      break;
    default:
      locationGroup = location.cluster_id || 'Unknown';
      notes = ['This location should be described using the supplied scene context only.'];
  }

  return {
    era_label: eraLabel,
    location_group: locationGroup,
    notes
  };
}

export interface BuildNarrationSceneContextInput {
  command: string;
  playerState: PlayerState;
  location: Location;
  npcs: NPC[];
  accessibleExits: Exit[];
  engineTruth?: Partial<NarrationSceneContext['engine_truth']>;
}

export function buildNarrationSceneContext(
  input: BuildNarrationSceneContextInput
): NarrationSceneContext | null {
  const normalizedCommand = input.command.toLowerCase();
  const isSupportedCommand = Array.from(SUPPORTED_SCENE_COMMANDS).some(cmd => normalizedCommand.startsWith(cmd));

  if (!isSupportedCommand) {
    return null;
  }

  const canonEraContext = buildCanonEraContext(input.location);
  return {
    command: input.command,
    player_summary: {
      era: input.playerState.era,
      location_id: input.playerState.location_id,
      time_of_day: input.playerState.time_of_day,
      day_number: input.playerState.day_number,
      money_drabs: input.playerState.money_drabs,
      academic_rank: input.playerState.academic_rank,
      hunger_label: getHungerLabel(input.playerState.hunger),
      fatigue_label: getFatigueLabel(input.playerState.fatigue),
      warmth_label: getWarmthLabel(input.playerState.warmth),
      injury_summary: getInjurySummary(input.playerState.injuries),
      social_standing_label: getSocialStandingLabel(input.playerState, input.location),
    },
    inventory_summary: {
      item_names: input.playerState.inventory.map(formatInventoryName),
      money_display: formatCurrency(input.playerState.money_drabs)
    },
    location_summary: {
      id: input.location.id,
      name: input.location.name,
      description_base: input.location.description_base,
      exits: input.accessibleExits.map((exit) => exit.direction)
    },
    npc_summary: {
      names: input.npcs.map((npc) => npc.name)
    },
    canon_era_context: canonEraContext,
    canon_registry_facts: getRelevantCanonFacts({
      command: input.command,
      locationId: input.location.id,
      locationGroup: canonEraContext.location_group,
      visibleNpcNames: input.npcs.map((npc) => npc.name)
    }),
    engine_truth: {
      movement_message: input.engineTruth?.movement_message,
      sympathy_outcome: input.engineTruth?.sympathy_outcome,
      social_outcome: input.engineTruth?.social_outcome,
      music_outcome: input.engineTruth?.music_outcome
    }
  };
}
