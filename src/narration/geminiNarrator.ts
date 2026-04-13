import { GEMINI_NARRATION_INSTRUCTIONS } from './canonInstructions';
import { buildGeminiSystemPrompt, buildGeminiUserPrompt } from './promptBuilder';
import type { NarrationProvider, NarrationSceneContext } from '../types';
import { LocalNarrator } from './localNarrator';

const DEFAULT_MODEL = 'gemini-1.5-flash-lite';
const DEFAULT_MAX_OUTPUT_TOKENS = 512;

export class GeminiNarrator implements NarrationProvider {
  private readonly localNarrator: LocalNarrator;
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required for GeminiNarrator.');
    }
    this.apiKey = apiKey.trim();
    this.localNarrator = new LocalNarrator();
  }

  renderLocation(
    location: import('../types').Location,
    state: import('../types').PlayerState,
    npcs: import('../types').NPC[],
    accessibleExits: import('../types').Exit[]
  ): string {
    return this.localNarrator.renderLocation(location, state, npcs, accessibleExits);
  }

  renderWait(state: import('../types').PlayerState): string {
    return this.localNarrator.renderWait(state);
  }

  renderFallback(input: string, state: import('../types').PlayerState): string {
    return this.localNarrator.renderFallback(input, state);
  }

  renderHelp(): string {
    return this.localNarrator.renderHelp();
  }

  async narrateScene(context: NarrationSceneContext): Promise<string> {
    const systemPrompt = buildGeminiSystemPrompt(context);
    const userPrompt = buildGeminiUserPrompt(context);
    const client = await this.createClient();

    if (!client) {
      return this.localNarrator.renderSceneFromContext(context);
    }

    try {
      const response = await client.models.generateContent({
        model: DEFAULT_MODEL,
        contents: [systemPrompt, userPrompt],
        config: {
          maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
          temperature: 0.7
        }
      });

      const text = response.text ?? '';

      if (!this.validateOutput(text)) {
        return this.localNarrator.renderSceneFromContext(context);
      }

      return text.trim();
    } catch (error) {
      return this.localNarrator.renderSceneFromContext(context);
    }
  }

  private async createClient(): Promise<any | null> {
    try {
      const module = (await import('@google/genai')) as any;
      const GoogleGenAI = module.GoogleGenAI;
      if (!GoogleGenAI) {
        return null;
      }

      return new GoogleGenAI({ apiKey: this.apiKey });
    } catch {
      return null;
    }
  }

  private validateOutput(text: string): boolean {
    if (!text || text.length > 1600) {
      return false;
    }

    const forbiddenPhrases = [
      'chandrian are',
      'the amyr are',
      "denna's patron is",
      'the doors of stone are',
      'true name of',
      'okay',
      'cool',
      'awesome',
      'weird vibe',
      'npc',
      'game'
    ];

    const lowerText = text.toLowerCase();
    for (const phrase of forbiddenPhrases) {
      if (lowerText.includes(phrase)) {
        return false;
      }
    }

    return true;
  }
}
