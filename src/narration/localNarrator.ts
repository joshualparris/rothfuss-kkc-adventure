import type { NarrationProvider } from './provider';
import { renderLocation } from './renderLocation';
import type { Exit, Location, NPC, PlayerState } from '../types';

const WAIT_LINES = [
  'The hour slides by while the University keeps its own counsel.',
  'You linger where you are, and the day turns a little further on.',
  'A little time passes in the old rhythm of bells, footsteps, and thought.',
  'You wait, and the world around you continues without hurry.'
];

const FALLBACK_LINES = [
  'The thought passes without resolution.',
  'Nothing comes of it just now.',
  'You hesitate, and the moment goes by.',
  'The University offers no answer to that.',
  'For now, you let the matter rest.'
];

export class LocalNarrator implements NarrationProvider {
  renderLocation(
    location: Location,
    state: PlayerState,
    npcs: NPC[],
    accessibleExits: Exit[]
  ): string {
    return renderLocation(location, state, npcs, accessibleExits);
  }

  renderWait(state: PlayerState): string {
    return WAIT_LINES[state.day_number % 4];
  }

  renderFallback(input: string, _state: PlayerState): string {
    return FALLBACK_LINES[input.length % 5];
  }

  renderHelp(): string {
    return [
      'If you are unsure, look around and take stock of where you stand.',
      'Go north, south, east, west, enter, or out when a path lies open to you.',
      'Eat when you can, sleep where you are able, and busk at Anker\'s if you need coin badly enough.',
      'Talk to someone directly if they are near, or ask them about a thing plainly.',
      'Wait if you mean to let the day move on, pay your tuition before it sours in your mind, and ask after your status or inventory when you need your measure.',
      'When you are finished, say quit and leave the place in peace.'
    ].join('\n');
  }

  renderSceneFromContext(context: import('../types').NarrationSceneContext): string {
    const { command, engine_truth } = context;
    if (engine_truth?.movement_message) {
      return engine_truth.movement_message;
    }
    if (engine_truth?.sympathy_outcome) {
      return `You attempt a sympathy binding. Outcome: ${engine_truth.sympathy_outcome}.`;
    }
    if (engine_truth?.social_outcome) {
      return `Your social interaction has an outcome: ${engine_truth.social_outcome}.`;
    }
    if (engine_truth?.music_outcome) {
      return `Your musical performance has an outcome: ${engine_truth.music_outcome}.`;
    }
    return `You ${command}. Nothing remarkable happens.`;
  }
}
