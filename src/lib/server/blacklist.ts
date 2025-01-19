import { loadJSON, saveJSON } from './storage.ts';

const blacklistedUsers = new Set<number>(
  loadJSON<number[]>('blacklist.json', [])
);

export function isBlacklisted(userId: number): boolean {
  return blacklistedUsers.has(userId);
}

export function addToBlacklist(userId: number): void {
  blacklistedUsers.add(userId);
  saveJSON('blacklist.json', Array.from(blacklistedUsers));
}

export function removeFromBlacklist(userId: number): void {
  blacklistedUsers.delete(userId);
  saveJSON('blacklist.json', Array.from(blacklistedUsers));
}