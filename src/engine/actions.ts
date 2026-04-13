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

const DIRECTION_ALIASES = new Map([
  ['n', 'north'],
  ['s', 'south'],
  ['e', 'east'],
  ['w', 'west'],
  ['u', 'up'],
  ['d', 'down'],
  ['in', 'enter'],
  ['out', 'out']
]);

const LOOK_COMMANDS = new Set(['look', 'look around', 'examine', 'inspect']);
const HELP_COMMANDS = new Set(['help', 'commands', '?']);
const INVENTORY_COMMANDS = new Set(['inventory', 'i', 'inv']);
const STATUS_COMMANDS = new Set(['status']);

function normalizeDirection(direction: string): string {
  const normalized = direction.trim().toLowerCase();
  if (DIRECTION_WORDS.has(normalized)) {
    return normalized;
  }

  return DIRECTION_ALIASES.get(normalized) ?? '';
}

function renderInventoryOutput(state: PlayerState): string {
  if (!state.inventory || state.inventory.length === 0) {
    return 'You are carrying nothing of note.';
  }

  return ['Inventory:']
    .concat(state.inventory.map((item) => (item.quantity > 1 ? `${item.name} x${item.quantity}` : item.name)))
    .join('\n');
}

function renderStatusOutput(
  state: PlayerState,
  location: import('../types').Location | null,
  accessibleExits: import('../types').Exit[]
): string {
  const lines = [
    `Location: ${location?.name ?? 'Unknown'}`,
    `Time: ${state.time_of_day}, Day ${state.day_number}`,
    `Money: ${state.money_drabs ?? 0} drabs`,
    `Rank: ${state.academic_rank}`
  ];

  if (typeof state.hunger === 'number') {
    lines.push(`Hunger: ${state.hunger}`);
  }

  if (typeof state.warmth === 'number') {
    lines.push(`Warmth: ${state.warmth}`);
  }

  if (state.sympathy_state && typeof state.sympathy_state.alar_strength === 'number') {
    lines.push(`Alar strength: ${state.sympathy_state.alar_strength}`);
  }

  lines.push(`Exits: ${accessibleExits.map((exit) => exit.direction).join(', ') || 'none'}`);

  return lines.join('\n');
}

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

  if (LOOK_COMMANDS.has(normalizedInput)) {
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

  if (HELP_COMMANDS.has(normalizedInput)) {
    return {
      output:
        'Available commands:\n' +
        '- look / examine / inspect\n' +
        '- north / south / east / west / up / down / in / out\n' +
        '- go <direction>\n' +
        '- inventory / i / inv\n' +
        '- status\n' +
        '- sympathy status / alar status\n' +
        '- sleep / rest / eat / wait\n' +
        '- help / commands / ?\n' +
        '\nTry typing a command or click one of the quick action buttons.',
      newState: state,
      shouldExit: false
    };
  }

  if (INVENTORY_COMMANDS.has(normalizedInput)) {
    return {
      output: renderInventoryOutput(state),
      newState: state,
      shouldExit: false
    };
  }

  if (STATUS_COMMANDS.has(normalizedInput)) {
    const location = getLocation(db, state.location_id);
    const accessibleExits = location ? getAccessibleExits(location, state) : [];

    return {
      output: renderStatusOutput(state, location, accessibleExits),
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

  const commandBody = normalizedInput.startsWith('go ')
    ? normalizedInput.slice(3).trim()
    : normalizedInput;
  const chosenDirection = normalizeDirection(commandBody);

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
