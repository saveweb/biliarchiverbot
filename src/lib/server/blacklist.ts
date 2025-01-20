import { env } from "$env/dynamic/private";
import { loadJSON, saveJSON } from "./storage.js";

const isEnabled = env.BILIARCHIVER_ENABLE_BLACKLIST === "true";
let blacklistedUsers = new Set<number>();

async function initBlacklist() {
  if (isEnabled) {
    const blacklist = await loadJSON<number[]>("blacklist.json", []);
    blacklistedUsers = new Set(blacklist);
  }
}

export function isBlacklisted(userId: number): boolean {
  if (!isEnabled) return false;
  return blacklistedUsers.has(userId);
}

export function addToBlacklist(userId: number): void {
  if (!isEnabled) return;
  blacklistedUsers.add(userId);
  saveJSON("blacklist.json", Array.from(blacklistedUsers));
}

export function removeFromBlacklist(userId: number): void {
  if (!isEnabled) return;
  blacklistedUsers.delete(userId);
  saveJSON("blacklist.json", Array.from(blacklistedUsers));
}

// Initialize blacklist
initBlacklist().catch(console.error);
