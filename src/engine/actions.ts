import { SYMPATHY_NARRATION } from '../content/sympathyNarration';
import type Database from 'better-sqlite3';
import { busk, checkTuitionDeadline, eat, payTuition, sleep } from './economy';
import { parseNPCCommand, talkToNPC } from './npcEngine';
import { askKilvinForWork, respondToAmbrose, workFisheryShift } from './socialEngine';
import type { NarrationProvider } from '../narration/provider';
import { buildNarrationSceneContext } from '../narration/narrationContext';
import {
  alarLabel,
  hungerLabel,
  renderInventory,
  renderStatus,
  warmthLabel
} from '../narration/renderStatus';
import type { CommandResult, PlayerState } from '../types';
import { getAccessibleExits, getLocation, getNPCsAtLocation, movePlayer } from './movement';
import { auditionForPipes, playAtEolian } from './musicEngine';
import {
  adjudicate,
  applySympatbyResult,
  buyMaterial,
  parseSympathyCommand,
  resolveMaterialId
} from './sympathyEngine';
import { advanceTime } from './time';

const DIRECTION_WORDS = new Set([
  'north',
  'south',
  'east',
  'west',
  'up',
  'down',
  'enter',
  'out',
  'in'
]);

async function renderSceneOutput(
  command: string,
  narrator: NarrationProvider,
  location: import('../types').Location,
  state: PlayerState,
  npcs: import('../types').NPC[],
  accessibleExits: import('../types').Exit[],
  engineTruth?: { movement_message?: string; sympathy_outcome?: string; social_outcome?: string; music_outcome?: string }
): Promise<string> {
  if (narrator.narrateScene) {
    try {
      const context = buildNarrationSceneContext({
        command,
        playerState: state,
        location,
        npcs,
        accessibleExits,
        engineTruth
      });

      if (context) {
        const narration = await narrator.narrateScene(context);
        if (narration) {
          return narration;
        }
      }
    } catch {
      // Fall back to local narration if Gemini fails.
    }
  }

  return narrator.renderLocation(location, state, npcs, accessibleExits);
}

function parseBuyCommand(input: string): { itemId: string; quantity: number } | null {
  const trimmedInput = input.trim();
  const quantityMatch = trimmedInput.match(/^buy\s+(\d+)\s+(.+)$/i);

  if (quantityMatch) {
    const quantity = Number.parseInt(quantityMatch[1], 10);
    const itemId = resolveMaterialId(quantityMatch[2]);

    if (!itemId) {
      return null;
    }

    return {
      itemId,
      quantity
    };
  }

  const singleMatch = trimmedInput.match(/^buy\s+(.+)$/i);

  if (!singleMatch) {
    return null;
  }

  const itemId = resolveMaterialId(singleMatch[1]);

  if (!itemId) {
    return null;
  }

  return {
    itemId,
    quantity: 1
  };
}

function sympathyStatusOutput(state: PlayerState): string {
  return [
    `Alar strength: ${alarLabel(state.sympathy_state.alar_strength)}`,
    `Warmth: ${warmthLabel(state.warmth)}`,
    `Times used today: ${state.sympathy_state.times_used_today}`,
    `Active bindings: ${state.sympathy_state.active_bindings}`
  ].join('\n');
}

function arrivalDirectionText(direction: string): string {
  if (direction === 'enter') {
    return 'inside';
  }

  return direction;
}

function finalizeStateChange(
  previousState: PlayerState,
  nextState: PlayerState,
  output: string
): CommandResult {
  const updatedState = checkTuitionDeadline(nextState);
  const warning =
    previousState.tuition_state.overdue === false && updatedState.tuition_state.overdue === true
      ? '\nA thought nags at you. Your tuition was due.'
      : '';

  return {
    output: `${output}${warning}`,
    newState: updatedState,
    shouldExit: false
  };
}

export async function dispatch(
  input: string,
  state: PlayerState,
  db: InstanceType<typeof Database>,
  narrator: NarrationProvider
): Promise<CommandResult> {
  const trimmedInput = input.trim();
  const normalizedInput = trimmedInput.toLowerCase();

  if (normalizedInput === 'look' || normalizedInput === 'look around') {
    const location = getLocation(db, state.location_id);

    if (!location) {
      throw new Error(`Location "${state.location_id}" was not found.`);
    }

    const npcs = getNPCsAtLocation(db, state.location_id);
    const accessibleExits = getAccessibleExits(location, state);

    const output = await renderSceneOutput(
      'look',
      narrator,
      location,
      state,
      npcs,
      accessibleExits
    );

    return {
      output,
      newState: state,
      shouldExit: false
    };
  }

  if (normalizedInput === 'sympathy status' || normalizedInput === 'alar status') {
    return {
      output: sympathyStatusOutput(state),
      newState: state,
      shouldExit: false
    };
  }

  const bareDirection = DIRECTION_WORDS.has(normalizedInput) ? normalizedInput : null;
  const goDirection = normalizedInput.startsWith('go ')
    ? normalizedInput.slice(3).trim()
    : '';
  const chosenDirection = bareDirection ?? (DIRECTION_WORDS.has(goDirection) ? goDirection : '');

  if (chosenDirection) {
    const movementResult = movePlayer(db, state, chosenDirection);

    if (!movementResult.success) {
      return {
        output: movementResult.message,
        newState: state,
        shouldExit: false
      };
    }

    const newLocation = getLocation(db, movementResult.newState.location_id);

    if (!newLocation) {
      throw new Error(`Location "${movementResult.newState.location_id}" was not found.`);
    }

    const npcs = getNPCsAtLocation(db, movementResult.newState.location_id);
    const accessibleExits = getAccessibleExits(newLocation, movementResult.newState);

    const sceneOutput = await renderSceneOutput(
      `go ${chosenDirection}`,
      narrator,
      newLocation,
      movementResult.newState,
      npcs,
      accessibleExits,
      {
        movement_message: `You make your way ${arrivalDirectionText(chosenDirection)}.`
      }
    );

    return finalizeStateChange(state, movementResult.newState, sceneOutput);
  }

  if (normalizedInput === 'wait') {
    const newState = advanceTime(state);
    const location = getLocation(db, newState.location_id);

    if (!location) {
      throw new Error(`Location "${newState.location_id}" was not found.`);
    }

    const npcs = getNPCsAtLocation(db, newState.location_id);
    const accessibleExits = getAccessibleExits(location, newState);

    const sceneOutput = await renderSceneOutput(
      'wait',
      narrator,
      location,
      newState,
      npcs,
      accessibleExits,
      {
        movement_message: narrator.renderWait(newState)
      }
    );

    return finalizeStateChange(state, newState, sceneOutput);
  }

  if (normalizedInput === 'eat') {
    const result = eat(state);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    const hungerLine =
      result.newState.hunger < state.hunger
        ? `\nHunger: ${hungerLabel(result.newState.hunger)}.`
        : '';

    return finalizeStateChange(state, result.newState, `${result.message}${hungerLine}`);
  }

  if (normalizedInput === 'sleep' || normalizedInput === 'rest') {
    const result = sleep(state);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    const location = getLocation(db, result.newState.location_id);

    if (!location) {
      throw new Error(`Location "${result.newState.location_id}" was not found.`);
    }

    const npcs = getNPCsAtLocation(db, result.newState.location_id);
    const accessibleExits = getAccessibleExits(location, result.newState);

    const sceneOutput = await renderSceneOutput(
      'sleep',
      narrator,
      location,
      result.newState,
      npcs,
      accessibleExits,
      {
        movement_message: result.message
      }
    );

    return finalizeStateChange(state, result.newState, sceneOutput);
  }

  if (
    normalizedInput === 'busk' ||
    normalizedInput === 'play' ||
    normalizedInput === 'perform'
  ) {
    const result = busk(state);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    return finalizeStateChange(state, result.newState, result.message);
  }

  if (normalizedInput === 'pay tuition' || normalizedInput === 'pay fees') {
    const result = payTuition(state);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    return finalizeStateChange(state, result.newState, result.message);
  }

  if (normalizedInput === 'audition for pipes') {
    const result = auditionForPipes(state, db);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    return finalizeStateChange(state, result.newState, result.message);
  }

  if (normalizedInput === 'play at eolian') {
    const result = playAtEolian(state, db);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    return finalizeStateChange(state, result.newState, result.message);
  }

  if (normalizedInput === 'ask kilvin for work') {
    const result = askKilvinForWork(state, db);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    return finalizeStateChange(state, result.newState, result.message);
  }

  if (normalizedInput === 'work fishery' || normalizedInput === 'work at fishery') {
    const result = workFisheryShift(state, db);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    return finalizeStateChange(state, result.newState, result.message);
  }

  if (normalizedInput === 'ignore ambrose') {
    const result = respondToAmbrose('ignore', state, db);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    return finalizeStateChange(state, result.newState, result.message);
  }

  if (normalizedInput === 'answer ambrose carefully') {
    const result = respondToAmbrose('careful', state, db);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    return finalizeStateChange(state, result.newState, result.message);
  }

  if (normalizedInput === 'answer ambrose sharply') {
    const result = respondToAmbrose('sharp', state, db);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    return finalizeStateChange(state, result.newState, result.message);
  }

  if (
    normalizedInput === 'use sympathy' ||
    normalizedInput.startsWith('use sympathy to ') ||
    normalizedInput.startsWith('bind ')
  ) {
    const attempt = parseSympathyCommand(trimmedInput);

    if (!attempt) {
      return {
        output: narrator.renderFallback(trimmedInput, state),
        newState: state,
        shouldExit: false
      };
    }

    const result = adjudicate(attempt, state);
    const updatedState = applySympatbyResult(state, result);
    const narrationPool = SYMPATHY_NARRATION[result.narration_key] ?? SYMPATHY_NARRATION.blocked_general;
    const narrationLine =
      narrationPool[updatedState.sympathy_state.times_used_today % narrationPool.length];
    const injuryLine = result.injury ? `\n${result.injury}.` : '';
    const coldWarning =
      updatedState.warmth < 30
        ? '\nCold settles deeper into you. Another binding would be a reckless thing.'
        : '';

    return finalizeStateChange(state, updatedState, `${narrationLine}${injuryLine}${coldWarning}`);
  }

  if (normalizedInput.startsWith('buy ')) {
    const parsedBuy = parseBuyCommand(trimmedInput);

    if (!parsedBuy) {
      return {
        output: "That's not something you can buy here.",
        newState: state,
        shouldExit: false
      };
    }

    const result = buyMaterial(parsedBuy.itemId, parsedBuy.quantity, state);

    if (result.newState === state) {
      return {
        output: result.message,
        newState: state,
        shouldExit: false
      };
    }

    return finalizeStateChange(state, result.newState, result.message);
  }

  const npcCommand = parseNPCCommand(trimmedInput);

  if (npcCommand) {
    return {
      output: talkToNPC(npcCommand.npc_id, npcCommand.topic, state, db),
      newState: state,
      shouldExit: false
    };
  }

  if (normalizedInput === 'status' || normalizedInput === 'stats') {
    return {
      output: renderStatus(state),
      newState: state,
      shouldExit: false
    };
  }

  if (
    normalizedInput === 'inventory' ||
    normalizedInput === 'inv' ||
    normalizedInput === 'i'
  ) {
    return {
      output: renderInventory(state),
      newState: state,
      shouldExit: false
    };
  }

  if (normalizedInput === 'help') {
    return {
      output: narrator.renderHelp(),
      newState: state,
      shouldExit: false
    };
  }

  if (normalizedInput === 'quit' || normalizedInput === 'exit') {
    return {
      output: 'You let the day settle behind you and step away for now.',
      newState: state,
      shouldExit: true
    };
  }

  return {
    output: narrator.renderFallback(trimmedInput, state),
    newState: state,
    shouldExit: false
  };
}
