import { loadJSON, saveJSON } from './storage.js';

const adminUsers = new Set<number>(
  loadJSON<number[]>('admins.json', [])
);

let firstAdmin: number | null = null;

export function isAdmin(userId: number): boolean {
  return adminUsers.has(userId);
}

export function addAdmin(userId: number): boolean {
  if (adminUsers.size === 0) {
    firstAdmin = userId;
  }
  adminUsers.add(userId);
  saveJSON('admins.json', Array.from(adminUsers));
  return true;
}

export function listAdmins(): number[] {
  return Array.from(adminUsers);
}