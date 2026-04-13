import { CanonRegistryEntry } from '../types';

export const CANON_REGISTRY: CanonRegistryEntry[] = [
  {
    id: 'currency_drabs',
    text: 'The currency of the Four Corners is the drab.',
    applies_to: ['global'],
    tags: ['money', 'currency'],
  },
  {
    id: 'currency_jacks',
    text: 'One jot is worth ten drabs. One royal is worth ten jots.',
    applies_to: ['global'],
    tags: ['money', 'currency'],
  },
  {
    id: 'academic_rank_e_lir',
    text: 'E\'lir is the lowest academic rank at the University.',
    applies_to: ['University'],
    tags: ['rank', 'academic'],
  },
  {
    id: 'academic_rank_re_lar',
    text: 'Re\'lar is the second academic rank at the University.',
    applies_to: ['University'],
    tags: ['rank', 'academic'],
  },
  {
    id: 'academic_rank_el_the',
    text: 'El\'the is the highest academic rank at the University.',
    applies_to: ['University'],
    tags: ['rank', 'academic'],
  },
  {
    id: 'archives_access_general',
    text: 'The Archives are a vast library at the University.',
    applies_to: ['University', 'archives'],
    tags: ['archives', 'University'],
  },
  {
    id: 'archives_access_restricted',
    text: 'Access to certain sections of the Archives is restricted.',
    applies_to: ['University', 'archives'],
    tags: ['archives', 'University'],
  },
  {
    id: 'sympathy_constraints_energy',
    text: 'Sympathy requires a source of energy.',
    applies_to: ['global', 'sympathy'],
    tags: ['sympathy'],
  },
  {
    id: 'sympathy_constraints_link',
    text: 'Sympathy requires a sympathetic link between objects.',
    applies_to: ['global', 'sympathy'],
    tags: ['sympathy'],
  },
  {
    id: 'sympathy_constraints_naming',
    text: 'True Sympathy requires knowledge of the true names of things.',
    applies_to: ['global', 'sympathy'],
    tags: ['sympathy'],
  },
  {
    id: 'talent_pipes_eolian',
    text: 'The Eolian is a music venue where musicians can earn their pipes.',
    applies_to: ['eolian'],
    tags: ['music', 'eolian', 'pipes'],
  },
  {
    id: 'talent_pipes_audition',
    text: 'Musicians must audition to play at the Eolian and earn their pipes.',
    applies_to: ['eolian'],
    tags: ['music', 'eolian', 'pipes'],
  },
  {
    id: 'university_location',
    text: 'The University is a center of learning in the Four Corners.',
    applies_to: ['University'],
    tags: ['University'],
  },
  {
    id: 'imre_location',
    text: 'Imre is a large city adjacent to the University.',
    applies_to: ['Imre'],
    tags: ['Imre'],
  },
  {
    id: 'stonebridge_location',
    text: 'Stonebridge is a small town near the University.',
    applies_to: ['Stonebridge'],
    tags: ['Stonebridge'],
  },
  {
    id: 'kilvin_npc',
    text: 'Kilvin is the Master Artificer at the University.',
    applies_to: ['University', 'kilvin'],
    tags: ['npc', 'University'],
  },
  {
    id: 'ambrose_npc',
    text: 'Ambrose Jakis is a wealthy and influential student at the University.',
    applies_to: ['University', 'ambrose'],
    tags: ['npc', 'University'],
  },
  {
    id: 'deoch_npc',
    text: 'Deoch is the proprietor of the Eolian.',
    applies_to: ['eolian', 'deoch'],
    tags: ['npc', 'eolian'],
  },
  {
    id: 'stanchion_npc',
    text: 'Stanchion is a bouncer at the Eolian.',
    applies_to: ['eolian', 'stanchion'],
    tags: ['npc', 'eolian'],
  },
  {
    id: 'fishery_work',
    text: 'Working at the Fishery can earn you money but is physically demanding.',
    applies_to: ['Imre', 'fishery'],
    tags: ['work', 'money'],
  },
  {
    id: 'kilvin_work',
    text: 'Kilvin sometimes offers work to students.',
    applies_to: ['University', 'kilvin'],
    tags: ['work', 'money'],
  },
];

export function getRelevantCanonFacts(input: {
  command: string;
  locationId: string;
  locationGroup: string;
  visibleNpcNames: string[];
}): string[] {
  const relevantFacts: Set<string> = new Set();

  // Add global facts
  CANON_REGISTRY.filter(entry => entry.applies_to.includes('global'))
    .forEach(entry => relevantFacts.add(entry.text));

  // Add location-specific facts
  CANON_REGISTRY.filter(entry => entry.applies_to.includes(input.locationGroup.toLowerCase()) || entry.applies_to.includes(input.locationId.toLowerCase()))
    .forEach(entry => relevantFacts.add(entry.text));

  // Add NPC-specific facts
  input.visibleNpcNames.forEach(npcName => {
    CANON_REGISTRY.filter(entry => entry.applies_to.includes(npcName.toLowerCase()))
      .forEach(entry => relevantFacts.add(entry.text));
  });

  // Add command-specific facts (e.g., if command is 'audition', add pipes facts)
  if (input.command.includes('audition') || input.command.includes('play')) {
    CANON_REGISTRY.filter(entry => entry.tags.includes('pipes') || entry.tags.includes('eolian'))
      .forEach(entry => relevantFacts.add(entry.text));
  }
  if (input.command.includes('sympathy') || input.command.includes('link')) {
    CANON_REGISTRY.filter(entry => entry.tags.includes('sympathy'))
      .forEach(entry => relevantFacts.add(entry.text));
  }
  if (input.command.includes('work') || input.command.includes('earn')) {
    CANON_REGISTRY.filter(entry => entry.tags.includes('work') || entry.tags.includes('money'))
      .forEach(entry => relevantFacts.add(entry.text));
  }

  // Convert set to array, sort for deterministic order, and limit to 6
  const sortedFacts = Array.from(relevantFacts).sort();
  return sortedFacts.slice(0, 6);
}
