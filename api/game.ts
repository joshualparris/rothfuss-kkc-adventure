import 'dotenv/config';

import db from '../src/db/connection';
import { runMigrations } from '../src/db/schema';
import { runSeed } from '../src/db/seed';
import { GeminiNarrator } from '../src/narration/geminiNarrator';
import { LocalNarrator } from '../src/narration/localNarrator';
import { dispatch } from '../src/engine/actions';
import { initDefaultPlayerState, loadPlayerState, savePlayerState } from '../src/engine/state';
import { getAccessibleExits, getLocation, getNPCsAtLocation } from '../src/engine/movement';
import type { PlayerState } from '../src/types';

const narrationMode = process.env.NARRATION_MODE?.toLowerCase() ?? 'auto';
const apiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
const useGemini = narrationMode === 'gemini' || (narrationMode === 'auto' && apiKey !== '');
const narrator = useGemini ? new GeminiNarrator(apiKey) : new LocalNarrator();
let dbInitialized = false;

function ensureDatabase(): void {
  if (dbInitialized) {
    return;
  }

  runMigrations(db);
  runSeed(db);

  const existingState = loadPlayerState(db);
  if (!existingState) {
    const defaultState = initDefaultPlayerState();
    savePlayerState(db, defaultState);
  }

  dbInitialized = true;
}

function getScenePayload(output: string, state: PlayerState): unknown {
  const location = getLocation(db, state.location_id);
  const npcs = getNPCsAtLocation(db, state.location_id);
  const accessibleExits = location ? getAccessibleExits(location, state) : [];

  return {
    output,
    location,
    npcs,
    accessibleExits,
    state
  };
}

export async function handleInit(): Promise<unknown> {
  ensureDatabase();

  let currentState = loadPlayerState(db);
  if (!currentState) {
    currentState = initDefaultPlayerState();
    savePlayerState(db, currentState);
  }

  const result = await dispatch('look', currentState, db, narrator);
  savePlayerState(db, result.newState);
  return getScenePayload(result.output, result.newState);
}

export async function handleCommand(command: string): Promise<unknown> {
  ensureDatabase();

  let currentState = loadPlayerState(db);
  if (!currentState) {
    currentState = initDefaultPlayerState();
    savePlayerState(db, currentState);
  }

  const result = await dispatch(command, currentState, db, narrator);
  savePlayerState(db, result.newState);
  return getScenePayload(result.output, result.newState);
}
