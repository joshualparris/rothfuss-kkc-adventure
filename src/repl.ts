import type Database from 'better-sqlite3';
import readline from 'readline';
import { dispatch } from './engine/actions';
import { getAccessibleExits, getAllLocations, getLocation, getNPCsAtLocation } from './engine/movement';
import { initDefaultPlayerState, loadPlayerState, savePlayerState } from './engine/state';
import type { NarrationProvider } from './narration/provider';
import { buildNarrationSceneContext } from './narration/narrationContext';
import type { Exit, Location, NPC, PlayerState } from './types';

const WELCOME_TEXT = [
  'You wake to another University morning with the taste of sleep still clinging to you.',
  'Cold light lies thin across the stone, and the day beyond your door is already quietly in motion.',
  'For a little while, the bells have not yet claimed you.',
  'The hour is yours, if you know how to spend it.'
].join(' ');

async function renderSceneOutput(
  command: string,
  narrator: NarrationProvider,
  location: Location,
  state: PlayerState,
  npcs: NPC[],
  accessibleExits: Exit[],
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
      // fall back to local rendering
    }
  }

  return narrator.renderLocation(location, state, npcs, accessibleExits);
}

export function startREPL(
  db: InstanceType<typeof Database>,
  narrator: NarrationProvider
): void {
  const loadedState = loadPlayerState(db);
  let currentState: PlayerState;

  if (loadedState) {
    currentState = loadedState;
  } else {
    currentState = initDefaultPlayerState();
    savePlayerState(db, currentState);
  }

  const worldLocations = getAllLocations(db);

  if (worldLocations.length === 0) {
    throw new Error('No locations are available. Seed data was not found.');
  }

  const startingLocation = getLocation(db, currentState.location_id);

  if (!startingLocation) {
    throw new Error(`Starting location "${currentState.location_id}" was not found.`);
  }

  const startingNpcs = getNPCsAtLocation(db, currentState.location_id);
  const startingExits = getAccessibleExits(startingLocation, currentState);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
  });
  let commandClosed = false;

  console.log(WELCOME_TEXT);
  console.log('');

  void (async () => {
    try {
      const initialScene = await renderSceneOutput(
        'start',
        narrator,
        startingLocation,
        currentState,
        startingNpcs,
        startingExits
      );

      console.log(initialScene);
      rl.prompt();

      for await (const line of rl) {
        const result = await dispatch(line, currentState, db, narrator);

        console.log(result.output);

        if (result.shouldExit) {
          commandClosed = true;
          rl.close();
          break;
        }

        currentState = result.newState;
        savePlayerState(db, currentState);
        rl.prompt();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred.';
      console.error(message);
      commandClosed = true;
      rl.close();
    }
  })();

  rl.on('close', () => {
    if (!commandClosed) {
      console.log('The bells will find you again when you return.');
    }
  });
}
