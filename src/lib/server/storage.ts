import { env } from "$env/dynamic/private";

const isEnabled = env.BILIARCHIVER_ENABLE_BLACKLIST === "true";

async function getModules() {
  if (!isEnabled) return null;
  // Use a function call so it's not statically imported
  const importFsPath = new Function("return import('fs')") as () => Promise<any>;
  const importPath = new Function("return import('path')") as () => Promise<any>;

  const fs = await importFsPath();
  const path = await importPath();
  return { fs, path };
}
async function ensureConfigDir() {
  const modules = await getModules();
  if (!modules) return;

  const CONFIG_DIR = modules.path.join(process.cwd(), "config");
  if (!modules.fs.existsSync(CONFIG_DIR)) {
    modules.fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export async function loadJSON<T>(
  filename: string,
  defaultValue: T
): Promise<T> {
  if (!isEnabled) return defaultValue;

  const modules = await getModules();
  if (!modules) return defaultValue;

  const filepath = modules.path.join(process.cwd(), "config", filename);
  try {
    return JSON.parse(modules.fs.readFileSync(filepath, "utf-8"));
  } catch {
    return defaultValue;
  }
}

export async function saveJSON(filename: string, data: any): Promise<void> {
  if (!isEnabled) return;

  const modules = await getModules();
  if (!modules) return;

  await ensureConfigDir();
  const filepath = modules.path.join(process.cwd(), "config", filename);
  modules.fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}
