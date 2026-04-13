import { buildNarrationSceneContext } from '../src/narration/narrationContext';
import { buildGeminiSystemPrompt, buildGeminiUserPrompt } from '../src/narration/promptBuilder';
import { initDefaultPlayerState } from '../src/engine/state';
import { LocalNarrator } from '../src/narration/localNarrator';

describe('PromptBuilder', () => {
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
    expect(context?.location_summary.exits).toEqual(['out']);
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
    expect(context?.location_summary.exits).toEqual(['out']);
  });

  // Test 3: buildNarrationSceneContext includes engine_truth fields when provided
  test('buildNarrationSceneContext includes engine_truth fields when provided', () => {
    const engineTruth = { movement_message: 'You move north.' };
    const context = createTestContext('go north', makePlayerState(), makeLocation(), makeNpcs(), [], engineTruth);
    expect(context?.engine_truth).toEqual(engineTruth);
  });

  // Test 4: buildNarrationSceneContext returns null for unsupported commands
  test('buildNarrationSceneContext returns null for unsupported commands', () => {
    const context = createTestContext('unsupported command');
    expect(context).toBeNull();
  });

  // Test 5: buildNarrationSceneContext includes money_display using formatted currency
  test('buildNarrationSceneContext includes money_display using formatted currency', () => {
    const context = createTestContext();
    expect(context?.inventory_summary.money_display).toBe('3 talents');
  });

  // Test 6: buildNarrationSceneContext includes lute in inventory_summary.item_names by default
  test('buildNarrationSceneContext includes lute in inventory_summary.item_names by default', () => {
    const context = createTestContext();
    expect(context?.inventory_summary.item_names).toContain("Kvothe's lute");
  });

  // Test 7: buildNarrationSceneContext builds University canon_era_context with 2-4 notes
  test('buildNarrationSceneContext builds University canon_era_context with 2-4 notes', () => {
    const context = createTestContext();
    expect(context?.canon_era_context.era_label).toBe('University era');
    expect(context?.canon_era_context.location_group).toBe('University');
    expect(context?.canon_era_context.notes.length).toBeGreaterThanOrEqual(2);
    expect(context?.canon_era_context.notes.length).toBeLessThanOrEqual(4);
  });

  // Test 8: buildNarrationSceneContext includes canon_registry_facts with at least two facts
  test('buildNarrationSceneContext includes canon_registry_facts with at least two facts', () => {
    const context = createTestContext();
    expect(context?.canon_registry_facts.length).toBeGreaterThanOrEqual(2);
    expect(context?.canon_registry_facts.every((fact) => typeof fact === 'string')).toBe(true);
    expect(context?.canon_registry_facts.some((fact) => fact.toLowerCase().includes('university'))).toBe(true);
  });

  // Test 9: buildGeminiSystemPrompt includes canon instruction text and era/location context and excludes raw inventory
  test('buildGeminiSystemPrompt includes canon instruction text and era/location context and excludes raw inventory', () => {
    const context = createTestContext();
    if (!context) throw new Error('Context should not be null');
    const systemPrompt = buildGeminiSystemPrompt(context);

    expect(systemPrompt).toContain('Use only the provided structured scene context');
    expect(systemPrompt).toContain('Era: University era');
    expect(systemPrompt).toContain('Location group: University');
    expect(systemPrompt).toContain('Canon Ground Truth:');
    expect(systemPrompt).not.toContain("Kvothe's lute");
  });

  // Test 10: buildGeminiUserPrompt includes location, time, NPCs, money, inventory, and engine_truth then ends with Write the scene now.
  test('buildGeminiUserPrompt includes location, time, NPCs, money, inventory, and engine_truth then ends with Write the scene now.', () => {
    const context = createTestContext();
    if (!context) throw new Error('Context should not be null');
    const enrichedContext = {
      ...context,
      engine_truth: {
        movement_message: 'You move quietly into the room.'
      }
    };

    const userPrompt = buildGeminiUserPrompt(enrichedContext);

    expect(userPrompt).toContain("Location: Kvothe's room, the Mews");
    expect(userPrompt).toContain('Time: morning, Day 1');
    expect(userPrompt).toContain('Visible people: none');
    expect(userPrompt).toContain('Money: 3 talents');
    expect(userPrompt).toContain('Inventory: Kvothe\'s lute');
    expect(userPrompt).toContain('Engine truth:');
    expect(userPrompt.endsWith('Write the scene now.')).toBe(true);
  });

  // Test 11: buildGeminiUserPrompt uses descriptive labels for player conditions
  test('buildGeminiUserPrompt uses descriptive labels for player conditions', () => {
    const context = createTestContext();
    if (!context) throw new Error('Context should not be null');
    const userPrompt = buildGeminiUserPrompt(context);

    expect(userPrompt).toContain('Hunger: Your thoughts move like thick honey.');
    expect(userPrompt).toContain('Fatigue: Your thoughts move like thick honey.');
    expect(userPrompt).toContain('Warmth: You are comfortably warm.');
  });

  // Test 12: buildGeminiUserPrompt includes social_standing_label when present
  test('buildGeminiUserPrompt includes social_standing_label when present', () => {
    const playerState = {
      ...makePlayerState(),
      reputation: {
        ...makePlayerState().reputation,
        academic_standing: 90,
      },
    };
    const context = createTestContext('look', playerState);
    if (!context) throw new Error('Context should not be null');
    const userPrompt = buildGeminiUserPrompt(context);

    expect(userPrompt).toContain('You are a respected student at the University.');
  });

  // Test 13: buildGeminiUserPrompt omits empty lines
  test('buildGeminiUserPrompt omits empty lines', () => {
    const playerState = {
      ...makePlayerState(),
      injuries: [],
      reputation: {
        ...makePlayerState().reputation,
        academic_standing: 0,
      },
    };
    const context = createTestContext('look', playerState);
    if (!context) throw new Error('Context should not be null');
    const userPrompt = buildGeminiUserPrompt(context);

    expect(userPrompt).not.toContain('Injuries:');
    expect(userPrompt).not.toContain('Social standing:');
  });
});
