import 'dotenv/config';

import db from './db/connection';
import { runMigrations } from './db/schema';
import { runSeed } from './db/seed';
import { GeminiNarrator } from './narration/geminiNarrator';
import { LocalNarrator } from './narration/localNarrator';
import { startREPL } from './repl';

const narrationMode = process.env.NARRATION_MODE?.toLowerCase() ?? 'auto';
const apiKey = process.env.GEMINI_API_KEY?.trim() ?? '';
const useGemini = narrationMode === 'gemini' || (narrationMode === 'auto' && apiKey !== '');

runMigrations(db);
runSeed(db);
const narrator = useGemini ? new GeminiNarrator(apiKey) : new LocalNarrator();
startREPL(db, narrator);
