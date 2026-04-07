import { readFileSync } from "fs";
import { join } from "path";

export function readTsConfigPaths(cwd: string): Record<string, string> {
  let raw: string;
  try {
    raw = readFileSync(join(cwd, "tsconfig.json"), "utf-8");
  } catch {
    return {};
  }

  let config: { compilerOptions?: { paths?: Record<string, string[]> } };
  try {
    config = JSON.parse(raw);
  } catch {
    return {};
  }

  const paths = config.compilerOptions?.paths;
  if (!paths) {
    return {};
  }

  const aliases: Record<string, string> = {};

  for (const [key, values] of Object.entries(paths)) {
    const target = values[0];
    if (!target) continue;

    // Strip trailing "/*" from both key and value
    const aliasKey = key.endsWith("/*") ? key.slice(0, -2) : key;
    const aliasValue = target.endsWith("/*") ? target.slice(0, -2) : target;

    aliases[aliasKey] = aliasValue;
  }

  return aliases;
}
