import { getRelevantCanonFacts, CANON_REGISTRY } from '../src/content/canonRegistry';

describe('getRelevantCanonFacts', () => {
  // Test 1: Returns global facts when no specific context is provided
  test('returns global facts when no specific context is provided', () => {
    const input = {
      command: 'look',
      locationId: 'some_room',
      locationGroup: 'some_group',
      visibleNpcNames: [],
    };
    const facts = getRelevantCanonFacts(input);
    expect(facts).toContain('The currency of the Four Corners is the drab.');
    expect(facts).toContain('One jot is worth ten drabs. One royal is worth ten jots.');
    expect(facts).toContain('Sympathy requires a source of energy.');
  });

  // Test 2: Returns location-specific facts
  test('returns location-specific facts for University', () => {
    const input = {
      command: 'look',
      locationId: 'university_archives',
      locationGroup: 'university',
      visibleNpcNames: [],
    };
    const facts = getRelevantCanonFacts(input);
    expect(facts).toContain('E\'lir is the lowest academic rank at the University.');
    expect(facts).toContain('The Archives are a vast library at the University.');
  });

  // Test 3: Returns NPC-specific facts
  test('returns NPC-specific facts for Kilvin', () => {
    const input = {
      command: 'talk to kilvin',
      locationId: 'university_artificery',
      locationGroup: 'university',
      visibleNpcNames: ['Kilvin'],
    };
    const facts = getRelevantCanonFacts(input);
    expect(facts).toContain('Kilvin is the Master Artificer at the University.');
    expect(facts).toContain('Kilvin sometimes offers work to students.');
  });

  // Test 4: Returns command-specific facts for audition
  test('returns command-specific facts for audition', () => {
    const input = {
      command: 'audition for pipes',
      locationId: 'eolian_stage',
      locationGroup: 'eolian',
      visibleNpcNames: [],
    };
    const facts = getRelevantCanonFacts(input);
    expect(facts).toContain('The Eolian is a music venue where musicians can earn their pipes.');
    expect(facts).toContain('Musicians must audition to play at the Eolian and earn their pipes.');
  });

  // Test 5: Returns command-specific facts for sympathy
  test('returns command-specific facts for sympathy', () => {
    const input = {
      command: 'use sympathy',
      locationId: 'some_room',
      locationGroup: 'some_group',
      visibleNpcNames: [],
    };
    const facts = getRelevantCanonFacts(input);
    expect(facts).toContain('Sympathy requires a source of energy.');
    expect(facts).toContain('Sympathy requires a sympathetic link between objects.');
  });

  // Test 6: Returns command-specific facts for work
  test('returns command-specific facts for work', () => {
    const input = {
      command: 'work at fishery',
      locationId: 'imre_fishery',
      locationGroup: 'imre',
      visibleNpcNames: [],
    };
    const facts = getRelevantCanonFacts(input);
    expect(facts).toContain('Working at the Fishery can earn you money but is physically demanding.');
  });

  // Test 7: Returns a maximum of 6 facts
  test('returns a maximum of 6 facts', () => {
    const input = {
      command: 'look',
      locationId: 'university_archives',
      locationGroup: 'university',
      visibleNpcNames: ['Kilvin', 'Ambrose'],
    };
    const facts = getRelevantCanonFacts(input);
    expect(facts.length).toBeLessThanOrEqual(6);
  });

  // Test 8: Returns at least 2 facts when possible
  test('returns at least 2 facts when possible', () => {
    const input = {
      command: 'look',
      locationId: 'some_room',
      locationGroup: 'some_group',
      visibleNpcNames: [],
    };
    const facts = getRelevantCanonFacts(input);
    expect(facts.length).toBeGreaterThanOrEqual(2);
  });

  // Test 9: Deterministic order
  test('returns facts in deterministic order', () => {
    const input = {
      command: 'look',
      locationId: 'university_archives',
      locationGroup: 'university',
      visibleNpcNames: ['Kilvin'],
    };
    const facts1 = getRelevantCanonFacts(input);
    const facts2 = getRelevantCanonFacts(input);
    expect(facts1).toEqual(facts2);
  });

  // Test 10: Handles mixed context
  test('handles mixed context (location, NPC, command)', () => {
    const input = {
      command: 'audition',
      locationId: 'eolian_stage',
      locationGroup: 'eolian',
      visibleNpcNames: ['Deoch'],
    };
    const facts = getRelevantCanonFacts(input);
    expect(facts).toContain('The Eolian is a music venue where musicians can earn their pipes.');
    expect(facts).toContain('Musicians must audition to play at the Eolian and earn their pipes.');
    expect(facts).toContain('Deoch is the proprietor of the Eolian.');
    expect(facts).toContain('The currency of the Four Corners is the drab.'); // Global fact
    expect(facts.length).toBeLessThanOrEqual(6);
  });

  // Test 11: No facts about forbidden topics
  test('does not include facts about forbidden topics', () => {
    const input = {
      command: 'look',
      locationId: 'some_room',
      locationGroup: 'some_group',
      visibleNpcNames: [],
    };
    const facts = getRelevantCanonFacts(input);
    const forbiddenTopics = ['Chandrian', 'Amyr', 'Denna', 'Doors of Stone', 'hidden Names'];
    forbiddenTopics.forEach(topic => {
      expect(facts.some(fact => fact.includes(topic))).toBe(false);
    });
  });
});
