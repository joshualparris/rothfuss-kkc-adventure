import { LocalNarrator } from './localNarrator';
import { GeminiNarrator } from './geminiNarrator';
import type { NarrationProvider } from '../types';

export { NarrationProvider };

export function selectNarrator(): NarrationProvider {
  const narrationMode = process.env.NARRATION_MODE || 'auto';
  const geminiApiKey = process.env.GEMINI_API_KEY;

  if (narrationMode === 'local') {
    return new LocalNarrator();
  }

  if (narrationMode === 'gemini' || (narrationMode === 'auto' && geminiApiKey)) {
    try {
      return new GeminiNarrator(geminiApiKey || '');
    } catch (error) {
      console.error('Failed to initialize GeminiNarrator, falling back to LocalNarrator:', error);
      return new LocalNarrator();
    }
  }

  return new LocalNarrator();
}
