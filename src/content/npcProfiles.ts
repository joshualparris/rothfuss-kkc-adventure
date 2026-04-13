import type { NPCProfile } from '../types';

export const NPC_PROFILES: Record<string, NPCProfile> = {
  simmon: {
    id: 'simmon',
    name: 'Simmon',
    era: 'university',
    home_location_id: 'university_ankers',
    temperament: 'warm, perceptive, genuinely decent, not naive',
    speech_style:
      'easy and direct, quick to laugh, notices things others miss, does not pry but does not ignore distress either',
    known_topics: [
      'classes',
      'tuition',
      'students',
      'music',
      'wilem',
      'university gossip',
      'how kvothe is doing'
    ],
    taboo_topics: ["his family's money", 'his noble background'],
    greeting_pool: [
      'Simmon looks up with an easy smile. "There you are."',
      'Simmon shifts his cup aside and gives you his full attention. "You look as though you could use a friendly word."',
      'Simmon brightens when he sees you. "Sit a moment, if you like."'
    ],
    exit_lines: [
      'He lets the matter rest there and does not press you.',
      'Simmon gives a small shrug and leaves the question where it lies.'
    ]
  },
  wilem: {
    id: 'wilem',
    name: 'Wilem',
    era: 'university',
    home_location_id: 'university_mains',
    temperament: 'reserved, loyal, sceptical, economical with words',
    speech_style:
      'brief, dry, Siaru accent shapes his phrasing, rarely volunteers information, trust runs deep once given',
    known_topics: ['classes', 'cealdim customs', 'money', 'archives', "kilvin's fishery work"],
    taboo_topics: ['personal family matters', 'siaru home life'],
    greeting_pool: [
      'Wilem gives you a short nod. "You are here."',
      'Wilem glances up from his thoughts. "Yes?"',
      'Wilem folds his arms and waits, calm as stone. "Speak."'
    ],
    exit_lines: [
      'He says no more, but the silence is not unfriendly.',
      'Wilem tips his chin once, which seems to be the end of it.'
    ]
  },
  anker: {
    id: 'anker',
    name: 'Anker',
    era: 'university',
    home_location_id: 'university_ankers',
    temperament: 'practical, tolerant, neither warm nor cold',
    speech_style: 'functional, inn-keeper terse, fair but not generous',
    known_topics: ['rooms', 'meals', 'work shifts', 'local gossip', "what's available at the inn"],
    taboo_topics: ["students' private business"],
    greeting_pool: [
      'Anker glances over and wipes his hands on a cloth. "What do you need?"',
      'Anker gives you a practical look. "If it is food, say so. If it is work, say that instead."',
      'Anker pauses in the middle of his work. "Go on."'
    ],
    exit_lines: [
      'He is already turning back to the room before the last word settles.',
      'Anker gives a curt nod and returns to his business.'
    ]
  },
  kilvin: {
    id: 'kilvin',
    name: 'Kilvin',
    era: 'university',
    home_location_id: 'university_fishery_outer',
    temperament: 'grave, methodical, practical, morally serious',
    speech_style: 'formal, precise, accented Aturan, judges skill and judgment together',
    known_topics: [
      'artificing',
      'sympathy safety',
      'work',
      'materials',
      'discipline',
      'University reputation'
    ],
    taboo_topics: ['private life', 'gossip', 'naming', 'noble politics'],
    greeting_pool: [
      'Kilvin looks up from the bench only after finishing what is in his hands. "Yes?"',
      'Kilvin spares you a measured glance. "Speak clearly."',
      'Kilvin keeps working a moment longer, then gives you his attention. "What is it?"'
    ],
    exit_lines: [
      'Kilvin turns back to the work as if that settles the matter.',
      'He gives a small nod and returns his attention to the bench.'
    ]
  },
  ambrose: {
    id: 'ambrose',
    name: 'Ambrose',
    era: 'university',
    home_location_id: 'university_archives_exterior',
    temperament: 'arrogant, cutting, entitled, socially dangerous',
    speech_style: 'smooth when it suits him, contemptuous when crossed, public-facing cruelty',
    known_topics: ['rank', 'admissions', 'the Archives', 'nobles', 'student gossip', 'Kvothe'],
    taboo_topics: ['apology', 'weakness', 'consequences for his own behaviour'],
    greeting_pool: [
      'Ambrose lets his gaze travel over you with practiced disdain. "Still here?"',
      'Ambrose smiles as if the sight of you amuses him in a mean-spirited way. "How persistent."',
      'Ambrose gives you the sort of attention one reserves for a nuisance. "What do you want?"'
    ],
    exit_lines: [
      'He dismisses you with a look sharp enough to draw blood if looks could manage it.',
      'Ambrose turns away as though the matter bored him from the start.'
    ]
  },
  deoch: {
    id: 'deoch',
    name: 'Deoch',
    era: 'university',
    home_location_id: 'eolian_floor',
    temperament: 'social, observant, seasoned, careful without seeming stiff',
    speech_style: 'easy and polished, hospitable, notices moods, not easily rattled',
    known_topics: ['music', 'players', 'the eolian', 'imre', 'pipes'],
    taboo_topics: [
      'private patron business',
      'gossip presented as fact',
      'being pressed for secrets'
    ],
    greeting_pool: [
      'Deoch offers you a polished smile. "Good evening."',
      'Deoch inclines his head and gives you an easy look. "What can I do for you?"',
      'Deoch notices you at once. "You look as though you have a question."'
    ],
    exit_lines: [
      'He leaves it there with practiced grace and turns to the room again.',
      'Deoch lets the talk end neatly and gives his attention elsewhere.'
    ]
  },
  stanchion: {
    id: 'stanchion',
    name: 'Stanchion',
    era: 'university',
    home_location_id: 'eolian_floor',
    temperament: 'practical, fair-minded, busy, good judge of performance',
    speech_style: 'plainspoken, steady, clear, judges music without ornament',
    known_topics: ['pipes', 'auditions', 'performers', 'rules', 'the eolian'],
    taboo_topics: ['flattery', 'shortcuts', 'entitlement'],
    greeting_pool: [
      'Stanchion gives you a brisk nod. "Yes?"',
      'Stanchion glances over from his work. "Make it quick."',
      'Stanchion gives you a fair, measuring look. "What is it?"'
    ],
    exit_lines: [
      'He gives a short nod and returns to his work.',
      'That seems enough for him, and he turns back to the room.'
    ]
  }
};

export const NPC_TOPIC_RESPONSES: Record<string, Record<string, string>> = {
  simmon: {
    classes:
      'He admits the term has everyone strung a little tight, though he says that is hardly new.',
    tuition:
      'He says most students think about tuition more often than they admit, especially when the term is still young.',
    students:
      'He says the University is full of clever people and very few of them know when to stop talking.',
    music:
      'He says music changes the whole room when it is honestly played, and that even tired men feel it.',
    wilem:
      'He says Wilem is steadier than most people deserve and sees more than he lets on.',
    'university gossip':
      'He says gossip grows best where half the facts are missing, which means it thrives here.',
    'how kvothe is doing':
      'He studies you for a moment and says you have looked better, though not beyond mending.'
  },
  wilem: {
    classes:
      'He says lectures are useful when the speaker respects the subject, and a waste when he does not.',
    'cealdim customs':
      'He says most people call something strange when it is merely not theirs.',
    money:
      'He says coin goes quickly when a man pretends he can ignore it.',
    archives:
      'He says the Archives reward patience and punish foolishness with equal consistency.',
    "kilvin's fishery work":
      'He says work under Kilvin teaches care, or else it teaches pain.'
  },
  anker: {
    rooms:
      'He says a room costs what it costs, and the bed is no softer for argument.',
    meals:
      'He says the food is plain, hot, and enough to keep a student upright.',
    'work shifts':
      'He says if you want hours, show up on time and do not make trouble for his staff.',
    'local gossip':
      'He says local gossip is mostly hungry students talking as if hunger were wisdom.',
    "what's available at the inn":
      'He says there is food, drink, and a roof, and most days that ought to satisfy a man.'
  },
  kilvin: {
    artificing:
      'He says artificing rewards care long before it rewards cleverness, and punishes the reverse.',
    'sympathy safety':
      'He says sympathy without discipline is merely a more efficient form of foolishness.',
    work:
      'He says work is useful when it is careful and dangerous when it is rushed.',
    materials:
      'He says good materials are only as good as the judgment guiding them.',
    discipline:
      'He says discipline is what remains after enthusiasm has burnt off.',
    'university reputation':
      'He says every careless arcanist stains more than his own name.'
  },
  ambrose: {
    rank:
      'Ambrose says rank matters because some men are born to stand above the scramble.',
    admissions:
      'He says the University admits more people than it ought, and suffers for generosity.',
    'the Archives':
      'He says the Archives are wasted on those who mistake access for belonging.',
    nobles:
      'He says breeding saves time that lesser men must waste proving themselves.',
    'student gossip':
      'Ambrose says gossip is most useful when it reminds people where they stand.',
    Kvothe:
      'Ambrose says your name as if it were a thing he found on his boot.'
  },
  deoch: {
    music:
      'Deoch says a room can forgive a rough coat sooner than careless music, and that is as it should be.',
    players:
      'He says the Eolian sees every kind of player, but only a few understand how to carry a room without begging it.',
    'the eolian':
      'He says the Eolian is kinder than its reputation only if a musician gives it reason to be.',
    imre:
      'Deoch says Imre is at its best after dusk, when people stop pretending they are only out on sensible errands.',
    pipes:
      'Deoch says the pipes are not bought, borrowed, or talked into being. A player earns them in the hearing of the room.'
  },
  stanchion: {
    pipes:
      'Stanchion says the pipes go only to a player who meets the standard in plain hearing.',
    auditions:
      'He says an audition is simple enough to explain and harder to survive: play well, and well enough to matter.',
    performers:
      'Stanchion says plenty of men can fill a room with sound, but fewer can give it music worth remembering.',
    rules:
      'He says the house runs on order, attention, and standards. If a player lacks any one of those, it shows.',
    'the eolian':
      'Stanchion says the room listens hard and remembers harder.'
  }
};

export const NPC_TABOO_DEFLECTIONS: Record<string, string> = {
  simmon:
    'Simmon\'s expression closes just a little. "I would rather leave that alone, if you do not mind."',
  wilem:
    'Wilem\'s gaze hardens. "No. That is not yours to ask."',
  anker:
    'Anker snorts once. "I keep other people\'s business off my tongue."',
  kilvin:
    'Kilvin\'s expression hardens. "No. That is not a useful question, and I will not spend time on it."',
  ambrose:
    'Ambrose lets out a quiet, contemptuous breath. "If you want humiliation, try elsewhere."',
  deoch:
    'Deoch\'s smile stays in place, but cools a little. "I do not trade in that sort of talk."',
  stanchion:
    'Stanchion gives you a level look. "No. We will not do that."'
};

export const NPC_GENERIC_RESPONSES: Record<string, string> = {
  simmon: 'Simmon considers it, then says he has no better answer than that today.',
  wilem: 'Wilem thinks on it and decides the question is too loose to trouble with.',
  anker: 'Anker gives the matter a glance and finds nothing in it worth lingering over.',
  kilvin: 'Kilvin decides the question is either ill-formed or not worth the heat of answering.',
  ambrose: 'Ambrose seems to find the question beneath him and treats it accordingly.',
  deoch: 'Deoch weighs the question, then lets it pass with a courteous half-smile.',
  stanchion: 'Stanchion judges the question wanting and leaves it there.'
};
