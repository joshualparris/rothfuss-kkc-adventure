import { LOCATION_FLAVOUR } from '../content/locationFlavour';
import { timeLabel } from '../engine/time';
import type { Exit, Location, NPC, PlayerState } from '../types';

function capitalizeFirstLetter(value: string): string {
  if (value.length === 0) {
    return value;
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function timeIndex(time: PlayerState['time_of_day']): number {
  if (time === 'morning') {
    return 0;
  }

  if (time === 'afternoon') {
    return 1;
  }

  if (time === 'evening') {
    return 2;
  }

  return 3;
}

function renderExitLine(accessibleExits: Exit[]): string {
  const directions = accessibleExits.map((exit) => exit.direction);

  if (directions.length === 0) {
    return 'There is no obvious way out.';
  }

  if (directions.length === 1) {
    return `You could go ${directions[0]}.`;
  }

  if (directions.length === 2) {
    return `You could go ${directions[0]} or ${directions[1]}.`;
  }

  const leadingDirections = directions.slice(0, -1).join(', ');
  const finalDirection = directions[directions.length - 1];

  return `You could go ${leadingDirections}, or ${finalDirection}.`;
}

export function renderLocation(
  location: Location,
  state: PlayerState,
  npcs: NPC[],
  accessibleExits: Exit[]
): string {
  const lines = [`--- ${capitalizeFirstLetter(location.name)} ---`, location.description_base];
  const flavourLines = LOCATION_FLAVOUR[location.id];

  if (flavourLines && flavourLines.length > 0) {
    const index = (state.day_number + timeIndex(state.time_of_day)) % flavourLines.length;
    lines.push(flavourLines[index]);
  }

  lines.push(`It is ${timeLabel(state.time_of_day)}.`);
  lines.push(renderExitLine(accessibleExits));

  for (const npc of npcs) {
    lines.push(`${npc.name} is here.`);
  }

  return lines.join('\n');
}
