import { env } from "$env/dynamic/private";

const isEnabled = env.BILIARCHIVER_ENABLE_BLACKLIST === "true";

let fs: any;
let path: any;

if (isEnabled) {
  fs = await import("fs");
  path = await import("path");

  const CONFIG_DIR = path.join(process.cwd(), "config");
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadJSON<T>(filename: string, defaultValue: T): T {
  if (!isEnabled) return defaultValue;
  const filepath = path.join(process.cwd(), "config", filename);
  try {
    return JSON.parse(fs.readFileSync(filepath, "utf-8"));
  } catch {
    return defaultValue;
  }
}

export function saveJSON(filename: string, data: any): void {
  if (!isEnabled) return;
  const filepath = path.join(process.cwd(), "config", filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}
