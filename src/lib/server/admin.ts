import { env } from "$env/dynamic/private";
import { loadJSON, saveJSON } from "./storage.js";

const isEnabled = env.BILIARCHIVER_ENABLE_BLACKLIST === "true";
let adminUsers = new Set<number>();

async function initAdmins() {
  if (isEnabled) {
    const admins = await loadJSON<number[]>("admins.json", []);
    adminUsers = new Set(admins);
  }
}

export function isAdmin(userId: number): boolean {
  if (!isEnabled) return false;
  return adminUsers.has(userId);
}

export function addAdmin(userId: number): boolean {
  if (!isEnabled) return false;
  adminUsers.add(userId);
  saveJSON("admins.json", Array.from(adminUsers));
  return true;
}

export function removeAdmin(userId: number): boolean {
  if (!isEnabled) return false;
  adminUsers.delete(userId);
  saveJSON("admins.json", Array.from(adminUsers));
  return true;
}

export function listAdmins(): number[] {
  if (!isEnabled) return [];
  return Array.from(adminUsers);
}

// Initialize admins
initAdmins().catch(console.error);
