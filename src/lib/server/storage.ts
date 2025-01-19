import * as fs from 'fs';
import * as path from 'path';

const CONFIG_DIR = path.join(process.cwd(), 'config');

if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

export function loadJSON<T>(filename: string, defaultValue: T): T {
  const filepath = path.join(CONFIG_DIR, filename);
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch {
    return defaultValue;
  }
}

export function saveJSON(filename: string, data: any): void {
  const filepath = path.join(CONFIG_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}