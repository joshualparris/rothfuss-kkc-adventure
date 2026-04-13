import type Database from 'better-sqlite3';
import {
  NPC_GENERIC_RESPONSES,
  NPC_PROFILES,
  NPC_TABOO_DEFLECTIONS,
  NPC_TOPIC_RESPONSES
} from '../content/npcProfiles';
import { getNPCsAtLocation } from './movement';
import type { NPC, NPCProfile, PlayerState } from '../types';

function capitalizeFirstLetter(value: string): string {
  if (value.length === 0) {
    return value;
  }

  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function normalizeTopic(topic: string): string {
  return topic.trim().toLowerCase();
}

function resolveTopicKey(profile: NPCProfile, topic: string | null): string | null {
  if (!topic) {
    return null;
  }

  const normalizedTopic = normalizeTopic(topic);

  return (
    profile.known_topics.find((knownTopic) => {
      const normalizedKnownTopic = knownTopic.toLowerCase();
      return (
        normalizedKnownTopic === normalizedTopic ||
        normalizedKnownTopic.includes(normalizedTopic) ||
        normalizedTopic.includes(normalizedKnownTopic)
      );
    }) ?? null
  );
}

function isTabooTopic(profile: NPCProfile, topic: string | null): boolean {
  if (!topic) {
    return false;
  }

  const normalizedTopic = normalizeTopic(topic);

  return profile.taboo_topics.some((tabooTopic) => {
    const normalizedTabooTopic = tabooTopic.toLowerCase();
    return (
      normalizedTabooTopic === normalizedTopic ||
      normalizedTabooTopic.includes(normalizedTopic) ||
      normalizedTopic.includes(normalizedTabooTopic)
    );
  });
}

function findMatchingNPC(npcs: NPC[], npcId: string): NPC | null {
  return (
    npcs.find((npc) => npc.id.toLowerCase() === npcId.toLowerCase()) ??
    npcs.find((npc) => npc.name.toLowerCase() === npcId.toLowerCase()) ??
    null
  );
}

export function getNPCProfile(npc_id: string): NPCProfile | null {
  return NPC_PROFILES[npc_id.trim().toLowerCase()] ?? null;
}

export function isNPCPresent(npc: NPC, state: PlayerState): boolean {
  return npc.location_id === state.location_id;
}

export function talkToNPC(
  npc_id: string,
  topic: string | null,
  state: PlayerState,
  db: InstanceType<typeof Database>
): string {
  const npcs = getNPCsAtLocation(db, state.location_id);
  const npc = findMatchingNPC(npcs, npc_id);
  const profile = getNPCProfile(npc?.id ?? npc_id);

  if (!npc || !isNPCPresent(npc, state)) {
    const displayName = profile?.name ?? capitalizeFirstLetter(npc_id);
    return `${displayName} isn't here right now.`;
  }

  if (!profile) {
    return `${npc.name} gives you a brief glance, but nothing comes of it.`;
  }

  const greeting = profile.greeting_pool[state.day_number % 3];
  const exitLine = profile.exit_lines[state.day_number % 2];

  if (topic === null) {
    return greeting;
  }

  if (isTabooTopic(profile, topic)) {
    const deflection = NPC_TABOO_DEFLECTIONS[profile.id] ?? `${profile.name} declines to answer.`;
    return `${deflection} ${exitLine}`;
  }

  const topicKey = resolveTopicKey(profile, topic);

  if (topicKey) {
    const topicResponse = NPC_TOPIC_RESPONSES[profile.id]?.[topicKey];

    if (topicResponse) {
      return `${greeting} ${topicResponse}`;
    }
  }

  const genericResponse =
    NPC_GENERIC_RESPONSES[profile.id] ?? `${profile.name} has nothing to add to that.`;

  return `${greeting} ${genericResponse} ${exitLine}`;
}

export function parseNPCCommand(input: string): { npc_id: string; topic: string | null } | null {
  const trimmedInput = input.trim();
  const talkMatch = trimmedInput.match(/^(talk to|speak to)\s+([a-zA-Z]+)(?:\s+about\s+(.+))?$/i);

  if (talkMatch) {
    return {
      npc_id: talkMatch[2].toLowerCase(),
      topic: talkMatch[3] ? talkMatch[3].trim().toLowerCase() : null
    };
  }

  const askMatch = trimmedInput.match(/^ask\s+([a-zA-Z]+)\s+about\s+(.+)$/i);

  if (askMatch) {
    return {
      npc_id: askMatch[1].toLowerCase(),
      topic: askMatch[2].trim().toLowerCase()
    };
  }

  return null;
}
