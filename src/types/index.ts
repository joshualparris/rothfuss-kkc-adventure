export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
export type AcademicRank = 'none' | 'E_lir' | 'Re_lar' | 'El_the';
export type CanonTier = 1 | 2 | 3;

export interface CanonRegistryEntry {
  id: string;
  text: string;
  applies_to: string[];
  tags: string[];
}

export type WarmthLevel =
  'warm' | 'comfortable' | 'cool' | 'cold' | 'dangerously_cold';
export type SympathyOutcome =
  'success' | 'slip' | 'bleedthrough' | 'backlash' | 'blocked';

export interface Exit {
  direction: string;
  target_location_id: string;
  access_condition?: string;
}

export interface Location {
  id: string;
  name: string;
  era: string;
  tier: CanonTier;
  cluster_id: string;
  description_base: string;
  exits: Exit[];
  is_accessible: boolean;
  travel_time_minutes: number;
  canon_source?: string;
}

export interface NPC {
  id: string;
  name: string;
  location_id: string;
  era: string;
  temperament: string;
  speech_style: string;
  conditions?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

export interface Reputation {
  academic_standing: number;
  university_social: number;
  eolian_standing: number;
  npc_trust: Record<string, number>;
}

export interface TuitionState {
  amount_drabs: number;
  due_on_day: number;
  paid: boolean;
  overdue: boolean;
}

export interface NPCProfile {
  id: string;
  name: string;
  era: string;
  home_location_id: string;
  temperament: string;
  speech_style: string;
  known_topics: string[];
  taboo_topics: string[];
  greeting_pool: string[];
  exit_lines: string[];
}

export interface SympathyState {
  alar_strength: number;
  warmth: number;
  active_bindings: number;
  times_used_today: number;
}

export interface SympathyAttempt {
  source_item_id: string;
  target_item_id: string;
  intent: string;
}

export interface SympathyResult {
  outcome: SympathyOutcome;
  heat_cost: number;
  alar_cost: number;
  injury: string | null;
  narration_key: string;
  state_changes: Partial<SympathyState>;
}

export interface FisheryState {
  approved_today: boolean;
  shifts_completed_today: number;
  last_approval_day: number | null;
}

export interface EolianState {
  has_talent_pipes: boolean;
  last_audition_day: number | null;
  performances_today: number;
}

export interface PlayerState {
  character_id: string;
  era: string;
  location_id: string;
  money_drabs: number;
  inventory: InventoryItem[];
  reputation: Reputation;
  time_of_day: TimeOfDay;
  day_number: number;
  term_number: number;
  injuries: string[];
  hunger: number;
  fatigue: number;
  academic_rank: AcademicRank;
  tuition_state: TuitionState;
  sympathy_state: SympathyState;
  fishery_state: FisheryState;
  eolian_state: EolianState;
  warmth: number;
  world_state_flags: Record<string, unknown>;
}

export interface NarrationSceneContext {
  command: string;
  player_summary: {
    era: string;
    location_id: string;
    time_of_day: TimeOfDay;
    day_number: number;
    money_drabs: number;
    academic_rank: AcademicRank;
    hunger_label: string;
    fatigue_label: string;
    warmth_label?: string;
    injury_summary?: string;
    social_standing_label?: string;
  };
  inventory_summary: {
    item_names: string[];
    money_display: string;
  };
  location_summary: {
    id: string;
    name: string;
    description_base: string;
    exits: string[];
  };
  npc_summary: {
    names: string[];
  };
  canon_era_context: {
    era_label: string;
    location_group: string;
    notes: string[];
  };
  canon_registry_facts: string[];
  engine_truth: {
    movement_message?: string;
    sympathy_outcome?: string;
    social_outcome?: string;
    music_outcome?: string;
  };
}

export interface NarrationProvider {
  renderLocation(
    location: Location,
    state: PlayerState,
    npcs: NPC[],
    accessibleExits: Exit[]
  ): string;
  renderWait(state: PlayerState): string;
  renderFallback(input: string, state: PlayerState): string;
  renderHelp(): string;
  narrateScene?(context: NarrationSceneContext): Promise<string>;
}

export interface CommandResult {
  output: string;
  newState: PlayerState;
  shouldExit: boolean;
}
