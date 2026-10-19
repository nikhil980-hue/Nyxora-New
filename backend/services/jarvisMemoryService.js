import { getMemory, saveMemory } from "./memoryService.js";

const KEY = "__jarvis";
const MAX_EVENTS = 40;
const MAX_FACTS = 60;

function clean(value, max = 600) { return String(value ?? "").trim().slice(0, max); }

export async function getJarvisMemory(userId) {
  if (!userId) return { facts: [], preferences: {}, taskPatterns: [], events: [] };
  const memory = await getMemory(userId);
  const jarvis = memory?.preferences?.[KEY];
  if (!jarvis || typeof jarvis !== "object") return { facts: [], preferences: {}, taskPatterns: [], events: [] };
  return {
    facts: Array.isArray(jarvis.facts) ? jarvis.facts.slice(-MAX_FACTS) : [],
    preferences: jarvis.preferences && typeof jarvis.preferences === "object" ? jarvis.preferences : {},
    taskPatterns: Array.isArray(jarvis.taskPatterns) ? jarvis.taskPatterns.slice(-MAX_EVENTS) : [],
    events: Array.isArray(jarvis.events) ? jarvis.events.slice(-MAX_EVENTS) : [],
  };
}

export async function rememberJarvisEvent(userId, event = {}) {
  if (!userId) return { success: false, error: "User ID required." };
  const existing = await getJarvisMemory(userId);
  const next = {
    ...existing,
    events: [...existing.events, { type: clean(event.type, 80), summary: clean(event.summary, 500), success: Boolean(event.success), at: new Date().toISOString() }].slice(-MAX_EVENTS),
  };
  await saveMemory(userId, { preferences: { [KEY]: next } });
  return { success: true, memory: next };
}

export async function rememberJarvisFact(userId, fact) {
  if (!userId) return { success: false, error: "User ID required." };
  const value = clean(fact, 600);
  if (!value) return { success: false, error: "Fact is empty." };
  const existing = await getJarvisMemory(userId);
  const facts = [...existing.facts.filter((item) => item !== value), value].slice(-MAX_FACTS);
  const next = { ...existing, facts };
  await saveMemory(userId, { preferences: { [KEY]: next } });
  return { success: true, memory: next };
}
