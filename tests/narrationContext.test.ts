import { buildNarrationSceneContext } from '../src/narration/narrationContext';
import { initDefaultPlayerState } from '../src/engine/state';

describe('buildNarrationSceneContext', () => {
  test('produces a complete scene context for a simple room', () => {
    const state = initDefaultPlayerState();
    const location = {
      id: 'university_mews_room',
      name: "Kvothe's room, the Mews",
      era: 'university',
      tier: 1 as const,
      cluster_id: 'university',
      description_base: 'A narrow room with one bed and a chair.',
      exits: [{ direction: 'out', target_location_id: 'university_mews_corridor' }],
      is_accessible: true,
      travel_time_minutes: 5
    };
    const npcs: Array<{ id: string; name: string; location_id: string; era: string; temperament: string; speech_style: string; }> = [];
    const accessibleExits = [{ direction: 'out', target_location_id: 'university_mews_corridor' }];

    const context = buildNarrationSceneContext({
      command: 'look',
      playerState: state,
      location,
      npcs,
      accessibleExits
    });

    expect(context.command).toBe('look');
    expect(context.player_summary.location_id).toBe(state.location_id);
    expect(context.location_summary.name).toBe(location.name);
    expect(context.location_summary.exits).toEqual(['out']);
    expect(context.npc_summary.names).toEqual([]);
    expect(context.engine_truth).toEqual({});
  });
});
