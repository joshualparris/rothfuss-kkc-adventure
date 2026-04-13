import { buildNarrationSceneContext } from '../src/narration/narrationContext';
import { buildGeminiSystemPrompt, buildGeminiUserPrompt } from '../src/narration/promptBuilder';
import { GeminiNarrator } from '../src/narration/geminiNarrator';
import { initDefaultPlayerState } from '../src/engine/state';
import { LocalNarrator } from '../src/narration/localNarrator';

describe('GeminiNarrator', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    // Mock process.env for startup selection tests
    process.env = { ...process.env, GEMINI_API_KEY: 'test-key', NARRATION_MODE: 'auto' };
  });

  const makePlayerState = () => ({
    ...initDefaultPlayerState(),
    location_id: 'university_mews_room',
    time_of_day: 'morning' as const,
    day_number: 1,
    money_drabs: 100,
    academic_rank: 'E_lir' as const,
    hunger: 10,
    fatigue: 10,
    warmth: 80,
    injuries: [],
  });

  const makeLocation = (exits: any[] = []) => ({
    id: 'university_mews_room',
    name: "Kvothe's room, the Mews",
    era: 'university',
    tier: 1 as const,
    cluster_id: 'university',
    description_base: 'A narrow room with one bed and a chair.',
    exits: exits,
    is_accessible: true,
    travel_time_minutes: 5,
  });

  const makeNpcs = () => ([]);

  // Helper to create a context for testing
  const createTestContext = (
    command: string = 'look',
    playerState = makePlayerState(),
    location = makeLocation(),
    npcs = makeNpcs(),
    accessibleExits: any[] = [],
    engineTruth?: any
  ) => {
    return buildNarrationSceneContext({
      command,
      playerState,
      location,
      npcs,
      accessibleExits,
      engineTruth,
    });
  };

  // Test 1: buildNarrationSceneContext produces directions-only exits
  test('buildNarrationSceneContext produces directions-only exits', () => {
    const location = makeLocation([
      { direction: 'out', target_location_id: 'university_mews_corridor', access_condition: 'always' },
      { direction: 'north', target_location_id: 'some_room', access_condition: 'requires_Re_lar' },
    ]);
    const accessibleExits = [{ direction: 'out', target_location_id: 'university_mews_corridor' }];
    const context = createTestContext('look', makePlayerState(), location, makeNpcs(), accessibleExits);
    expect(context.location_summary.exits).toEqual(['out']);
  });

  // Test 2: buildNarrationSceneContext excludes blocked exits
  test('buildNarrationSceneContext excludes blocked exits', () => {
    const location = makeLocation([
      { direction: 'out', target_location_id: 'university_mews_corridor' },
      { direction: 'north', target_location_id: 'some_room', access_condition: 'locked_at_night' },
    ]);
    const playerState = { ...makePlayerState(), time_of_day: 'night' as const };
    const accessibleExits = [{ direction: 'out', target_location_id: 'university_mews_corridor' }]; // Only 'out' is accessible at night
    const context = createTestContext('look', playerState, location, makeNpcs(), accessibleExits);
    expect(context.location_summary.exits).toEqual(['out']);
  });

  // Test 3: buildNarrationSceneContext includes engine_truth fields when provided
  test('buildNarrationSceneContext includes engine_truth fields when provided', () => {
    const engineTruth = { movement_message: 'You move north.' };
    const context = createTestContext('go north', makePlayerState(), makeLocation(), makeNpcs(), [], engineTruth);
    expect(context.engine_truth).toEqual(engineTruth);
  });

  // Test 8: missing API key constructor throws clear error (updated)
  test('GeminiNarrator constructor throws when GEMINI_API_KEY is not configured', () => {
    expect(() => new GeminiNarrator('')).toThrow('GEMINI_API_KEY is required for GeminiNarrator.');
  });

  // Test 4: GeminiNarrator.validateOutput accepts short normal text
  test('validateOutput accepts short normal text', () => {
    const narrator = new GeminiNarrator('test-key');
    expect((narrator as any).validateOutput('This is a normal sentence.')).toBe(true);
  });

  // Test 5: GeminiNarrator.validateOutput rejects forbidden mystery phrase
  test('validateOutput rejects forbidden mystery phrase', () => {
    const narrator = new GeminiNarrator('test-key');
    expect((narrator as any).validateOutput('The Chandrian are bad guys.')).toBe(false);
  });

  // Test 6: GeminiNarrator.validateOutput rejects modern slang phrase
  test('validateOutput rejects modern slang phrase', () => {
    const narrator = new GeminiNarrator('test-key');
    expect((narrator as any).validateOutput('This is so cool, dude.')).toBe(false);
  });

  // Test 7: GeminiNarrator.validateOutput rejects overly long output
  test('validateOutput rejects overly long output', () => {
    const narrator = new GeminiNarrator('test-key');
    const longText = 'a'.repeat(1601);
    expect((narrator as any).validateOutput(longText)).toBe(false);
  });

  // Test 9: API failure returns local fallback text
  test('API failure returns local fallback text', async () => {
    const narrator = new GeminiNarrator('test-key');
    const context = createTestContext();
    const mockClient = {
      getGenerativeModel: jest.fn().mockReturnThis(),
      generateContent: jest.fn().mockRejectedValue(new Error('API error'))
    };
    jest.spyOn(narrator as any, 'createClient').mockResolvedValue(mockClient);
    const localNarratorSpy = jest.spyOn(narrator.localNarrator, 'renderSceneFromContext');

    const result = await narrator.narrateScene(context);
    expect(localNarratorSpy).toHaveBeenCalledWith(context);
    expect(result).toBe(localNarratorSpy.mock.results[0].value);
  });

  // Test 10: invalid Gemini output returns local fallback text
  test('invalid Gemini output returns local fallback text', async () => {
    const narrator = new GeminiNarrator('test-key');
    const context = createTestContext();
    const mockClient = {
      getGenerativeModel: jest.fn().mockReturnThis(),
      generateContent: jest.fn().mockResolvedValue({ response: { text: () => 'The Chandrian are bad.' } })
    };
    jest.spyOn(narrator as any, 'createClient').mockResolvedValue(mockClient);
    const localNarratorSpy = jest.spyOn(narrator.localNarrator, 'renderSceneFromContext');

    const result = await narrator.narrateScene(context);
    expect(localNarratorSpy).toHaveBeenCalledWith(context);
    expect(result).toBe(localNarratorSpy.mock.results[0].value);
  });

  // Test 11: NARRATION_MODE=local uses LocalNarrator (mocking process.env)
  test('NARRATION_MODE=local uses LocalNarrator', async () => {
    process.env.NARRATION_MODE = 'local';
    const { selectNarrator } = require('../src/index'); // Assuming selectNarrator is exported from index.ts
    const narrator = selectNarrator();
    expect(narrator).toBeInstanceOf(LocalNarrator);
  });

  // Test 12: NARRATION_MODE=auto without GEMINI_API_KEY uses LocalNarrator (mocking process.env)
  test('NARRATION_MODE=auto without GEMINI_API_KEY uses LocalNarrator', async () => {
    process.env.NARRATION_MODE = 'auto';
    process.env.GEMINI_API_KEY = '';
    const { selectNarrator } = require('../src/index'); // Assuming selectNarrator is exported from index.ts
    const narrator = selectNarrator();
    expect(narrator).toBeInstanceOf(LocalNarrator);
  });

  // Existing tests (modified to use createTestContext and updated constructor)
  test('returns Gemini text when the client successfully generates content', async () => {
    const narrator = new GeminiNarrator('test-key');
    const context = createTestContext();
    const mockClient = {
      getGenerativeModel: jest.fn().mockReturnThis(),
      generateContent: jest.fn().mockResolvedValue({ response: { text: () => 'Generated Gemini narration.' } })
    };

    jest.spyOn(narrator as any, 'createClient').mockResolvedValue(mockClient);

    await expect(narrator.narrateScene(context)).resolves.toBe('Generated Gemini narration.');
    expect(mockClient.getGenerativeModel).toHaveBeenCalledWith({ model: 'gemini-1.5-flash-lite' });
    expect(mockClient.generateContent).toHaveBeenCalled();
  });

  test('uses promptBuilder output when narrating scenes', async () => {
    const narrator = new GeminiNarrator('test-key');
    const context = createTestContext();
    const mockClient = {
      getGenerativeModel: jest.fn().mockReturnThis(),
      generateContent: jest.fn().mockResolvedValue({ response: { text: () => 'Generated narration.' } })
    };

    jest.spyOn(narrator as any, 'createClient').mockResolvedValue(mockClient);
    const promptBuilder = require('../src/narration/promptBuilder');
    const systemSpy = jest.spyOn(promptBuilder, 'buildGeminiSystemPrompt');
    const userSpy = jest.spyOn(promptBuilder, 'buildGeminiUserPrompt');

    await expect(narrator.narrateScene(context)).resolves.toBe('Generated narration.');
    expect(systemSpy).toHaveBeenCalledWith(context);
    expect(userSpy).toHaveBeenCalledWith(context);
  });

  test('does not fall back when promptBuilder returns valid strings and Gemini returns text', async () => {
    const narrator = new GeminiNarrator('test-key');
    const context = createTestContext();
    const mockClient = {
      getGenerativeModel: jest.fn().mockReturnThis(),
      generateContent: jest.fn().mockResolvedValue({ response: { text: () => 'Success narration.' } })
    };

    jest.spyOn(narrator as any, 'createClient').mockResolvedValue(mockClient);
    const promptBuilder = require('../src/narration/promptBuilder');
    jest.spyOn(promptBuilder, 'buildGeminiSystemPrompt').mockReturnValue('system prompt');
    jest.spyOn(promptBuilder, 'buildGeminiUserPrompt').mockReturnValue('user prompt');

    await expect(narrator.narrateScene(context)).resolves.toBe('Success narration.');
  });
});
