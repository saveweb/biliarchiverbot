import { env } from "$env/dynamic/private";
import { loadJSON, saveJSON } from "./storage.js";

const isEnabled = env.BILIARCHIVER_ENABLE_BLACKLIST === "true";
const adminUsers = isEnabled
  ? new Set<number>(loadJSON<number[]>("admins.json", []))
  : new Set<number>();

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

export function listAdmins(): number[] {
  if (!isEnabled) return [];
  return Array.from(adminUsers);
}
