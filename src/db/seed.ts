import 'dotenv/config';

import type Database from 'better-sqlite3';
import { runMigrations } from './schema';

interface SeedLocation {
  id: string;
  name: string;
  era: string;
  tier: 1 | 2;
  cluster_id: 'university' | 'river_crossing' | 'imre';
  description_base: string;
  exits: Array<{
    direction: string;
    target_location_id: string;
    access_condition?: string;
  }>;
  is_accessible: 1;
  travel_time_minutes: number;
  canon_source: string;
}

interface SeedNPC {
  id: string;
  name: string;
  location_id: string;
  era: string;
  temperament: string;
  speech_style: string;
  conditions?: string;
}

const LOCATIONS: SeedLocation[] = [
  {
    id: 'university_mews_room',
    name: "Kvothe's room, the Mews",
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'The room is narrow, cold, and just large enough for a bed, a chair, and what little you can call your own. The plaster shows its age, and every comfort here has been argued for against cost.',
    exits: [{ direction: 'out', target_location_id: 'university_mews_corridor' }],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_mews_corridor',
    name: 'the Mews corridor',
    era: 'university',
    tier: 2,
    cluster_id: 'university',
    description_base:
      'The corridor is cramped and plain, with thin doors set close along the wall. Sound carries too easily here: boots on boards, a cough, the rustle of someone starting the day before they are ready.',
    exits: [
      { direction: 'in', target_location_id: 'university_mews_room' },
      { direction: 'south', target_location_id: 'university_courtyard' }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_courtyard',
    name: 'the University courtyard',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'Open air and stone give the place a sense of motion even when no one stops to speak. Students cross it with books under arm, cloaks tight against the weather, and their minds already half elsewhere.',
    exits: [
      { direction: 'north', target_location_id: 'university_mews_corridor' },
      { direction: 'east', target_location_id: 'university_mains' },
      { direction: 'west', target_location_id: 'university_ankers' }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_mains',
    name: 'the Mains',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'The great halls of the University gather voices into a soft, constant murmur. Footsteps pass over worn stone, and the air carries the dry scent of paper, wool, and lamp oil.',
    exits: [
      { direction: 'north', target_location_id: 'university_artificery' },
      { direction: 'east', target_location_id: 'university_archives_exterior' },
      { direction: 'south', target_location_id: 'university_medica' },
      { direction: 'west', target_location_id: 'university_courtyard' },
      { direction: 'enter', target_location_id: 'university_mains_hall' }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_artificery',
    name: 'the Artificery',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'Heat presses against the skin here, and the sharp tang of metalwork lingers in the throat. Hammering rises and falls from deeper within, steady as a second heartbeat.',
    exits: [
      { direction: 'south', target_location_id: 'university_mains' },
      { direction: 'enter', target_location_id: 'university_fishery_outer' }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_fishery_outer',
    name: 'the Fishery, outer workspace',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'Heat and bright metal light meet you at once, along with the rough chorus of tools striking work in progress. The air smells of oil, hot iron, and concentration worn thin by long hours.',
    exits: [
      { direction: 'south', target_location_id: 'university_mains' },
      { direction: 'out', target_location_id: 'university_artificery' }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_archives_exterior',
    name: 'the Archives, outer steps',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'The stone steps before the Archives hold a hush that feels different from the rest of the University. Sound seems to settle here, as if even idle talk knows better than to carry too far.',
    exits: [
      { direction: 'west', target_location_id: 'university_mains' },
      {
        direction: 'enter',
        target_location_id: 'university_archives_stacks',
        access_condition: 'requires_Re_lar'
      }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_archives_stacks',
    name: 'the Stacks',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'Rows of shelving vanish into the quiet, leaving only the rustle of turned pages and the faint dust of old bindings. The air is cool and still, held in careful order.',
    exits: [{ direction: 'out', target_location_id: 'university_archives_exterior' }],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_mains_hall',
    name: 'the Mains, lecture hall',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'Rows of benches face the front in a room meant for attention, though not all of it is freely given. Chalk dust, ink, and damp wool linger together under the stillness before a lecture begins.',
    exits: [{ direction: 'out', target_location_id: 'university_mains' }],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_medica',
    name: 'the Medica',
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'The Medica smells of clean cloth, herbs, and the bitter trace of old remedies. Voices are kept low, and every motion feels measured against pain.',
    exits: [{ direction: 'north', target_location_id: 'university_mains' }],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_ankers',
    name: "Anker's inn",
    era: 'university',
    tier: 1,
    cluster_id: 'university',
    description_base:
      'The inn carries the warmth of cooking, old wood, and too many tired students trying to make an evening of narrow means. Conversation rises and falls easily here, helped along by drink and the relief of being indoors.',
    exits: [
      { direction: 'east', target_location_id: 'university_courtyard' },
      { direction: 'west', target_location_id: 'university_riverside_road' }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'university_riverside_road',
    name: 'the riverside road',
    era: 'university',
    tier: 2,
    cluster_id: 'university',
    description_base:
      'The road runs close enough to the water for the air to pick up the river and carry it along the stones. Carts, students, and townsfolk all use it, each with a different pace and purpose.',
    exits: [
      { direction: 'east', target_location_id: 'university_ankers' },
      { direction: 'west', target_location_id: 'stonebridge' }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'stonebridge',
    name: 'Stonebridge',
    era: 'university',
    tier: 1,
    cluster_id: 'river_crossing',
    description_base:
      'The bridge carries a steady exchange of feet, wheels, and voices from one side of the river to the other. Water moves below in a broad, constant sound that seems indifferent to all of it.',
    exits: [
      { direction: 'east', target_location_id: 'university_riverside_road' },
      { direction: 'west', target_location_id: 'imre_fountain_square' }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'imre_fountain_square',
    name: 'the square before the Eolian',
    era: 'university',
    tier: 1,
    cluster_id: 'imre',
    description_base:
      'The square feels brighter and more openly social than the University side, with better cloth, easier laughter, and people who expect to be seen. A fountain gives the air a cool note under the passing talk and lamplight.',
    exits: [
      { direction: 'east', target_location_id: 'stonebridge' },
      { direction: 'west', target_location_id: 'eolian_exterior' }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'eolian_exterior',
    name: 'outside the Eolian',
    era: 'university',
    tier: 1,
    cluster_id: 'imre',
    description_base:
      'People slow here without admitting they are doing so, measuring one another and the door alike. Music and conversation do not spill out so much as wait somewhere just beyond the threshold.',
    exits: [
      { direction: 'east', target_location_id: 'imre_fountain_square' },
      {
        direction: 'enter',
        target_location_id: 'eolian_floor',
        access_condition: 'open_evening'
      }
    ],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  },
  {
    id: 'eolian_floor',
    name: 'the Eolian',
    era: 'university',
    tier: 1,
    cluster_id: 'imre',
    description_base:
      'The room is warm with lamplight, polished wood, and the focused quiet of people who know how to listen. Every conversation seems to leave a margin around the music, as if the whole place is waiting to be impressed.',
    exits: [{ direction: 'out', target_location_id: 'eolian_exterior' }],
    is_accessible: 1,
    travel_time_minutes: 5,
    canon_source: 'The Name of the Wind'
  }
];

const NPCS: SeedNPC[] = [
  {
    id: 'simmon',
    name: 'Simmon',
    location_id: 'university_ankers',
    era: 'university',
    temperament: 'warm, perceptive, genuinely decent, not naive',
    speech_style:
      'easy and direct, quick to laugh, notices things others miss, does not pry but does not ignore distress either'
  },
  {
    id: 'wilem',
    name: 'Wilem',
    location_id: 'university_mains',
    era: 'university',
    temperament: 'reserved, loyal, sceptical, economical with words',
    speech_style:
      'brief, dry, Siaru accent shapes his phrasing, rarely volunteers information, trust runs deep once given'
  },
  {
    id: 'anker',
    name: 'Anker',
    location_id: 'university_ankers',
    era: 'university',
    temperament: 'practical, tolerant, neither warm nor cold',
    speech_style: 'functional, inn-keeper terse, fair but not generous'
  },
  {
    id: 'kilvin',
    name: 'Kilvin',
    location_id: 'university_fishery_outer',
    era: 'university',
    temperament: 'grave, methodical, practical, morally serious',
    speech_style:
      'measured, formal, heavily accented Aturan, sparse praise, direct disapproval when warranted'
  },
  {
    id: 'ambrose',
    name: 'Ambrose',
    location_id: 'university_archives_exterior',
    era: 'university',
    temperament: 'arrogant, cutting, entitled, socially dangerous',
    speech_style:
      'coldly amused, status-conscious, dismissive, sharp in public, cruel when crossed'
  },
  {
    id: 'deoch',
    name: 'Deoch',
    location_id: 'eolian_floor',
    era: 'university',
    temperament: 'social, observant, seasoned, careful without seeming stiff',
    speech_style: 'easy, polished, attentive, capable of warmth but not foolish'
  },
  {
    id: 'stanchion',
    name: 'Stanchion',
    location_id: 'eolian_floor',
    era: 'university',
    temperament: 'practical, fair-minded, busy, good judge of performance',
    speech_style: 'plainspoken, steady, hospitable but brisk when working'
  }
];

export function runSeed(db: InstanceType<typeof Database>): void {
  runMigrations(db);

  const insertLocation = db.prepare(`
    INSERT OR IGNORE INTO locations (
      id,
      name,
      era,
      tier,
      cluster_id,
      description_base,
      exits,
      is_accessible,
      travel_time_minutes,
      canon_source
    ) VALUES (
      @id,
      @name,
      @era,
      @tier,
      @cluster_id,
      @description_base,
      @exits,
      @is_accessible,
      @travel_time_minutes,
      @canon_source
    )
  `);
  const updateLocation = db.prepare(`
    UPDATE locations
    SET
      name = @name,
      era = @era,
      tier = @tier,
      cluster_id = @cluster_id,
      description_base = @description_base,
      exits = @exits,
      is_accessible = @is_accessible,
      travel_time_minutes = @travel_time_minutes,
      canon_source = @canon_source
    WHERE id = @id
  `);
  const insertNpc = db.prepare(`
    INSERT OR IGNORE INTO npcs (
      id,
      name,
      location_id,
      era,
      temperament,
      speech_style,
      conditions
    ) VALUES (
      @id,
      @name,
      @location_id,
      @era,
      @temperament,
      @speech_style,
      @conditions
    )
  `);
  const updateNpc = db.prepare(`
    UPDATE npcs
    SET
      name = @name,
      location_id = @location_id,
      era = @era,
      temperament = @temperament,
      speech_style = @speech_style,
      conditions = @conditions
    WHERE id = @id
  `);
  const seedWorldState = db.prepare(`
    INSERT OR IGNORE INTO world_state (id, flags)
    VALUES (1, @flags)
  `);
  const updateWorldState = db.prepare(`
    UPDATE world_state
    SET flags = @flags
    WHERE id = 1
  `);

  const seed = db.transaction((locations: SeedLocation[], npcs: SeedNPC[]) => {
    for (const location of locations) {
      const serializedLocation = {
        ...location,
        exits: JSON.stringify(location.exits)
      };

      insertLocation.run(serializedLocation);
      updateLocation.run(serializedLocation);
    }

    for (const npc of npcs) {
      const serializedNpc = {
        ...npc,
        conditions: npc.conditions ?? null
      };

      insertNpc.run(serializedNpc);
      updateNpc.run(serializedNpc);
    }

    const worldFlags = JSON.stringify({ tuition_due_on_day: 14 });
    seedWorldState.run({ flags: worldFlags });
    updateWorldState.run({ flags: worldFlags });
  });

  seed(LOCATIONS, NPCS);
}

if (require.main === module) {
  const loaded = require('./connection') as { default: InstanceType<typeof Database> };
  runSeed(loaded.default);
  console.log('Database seeded.');
}
