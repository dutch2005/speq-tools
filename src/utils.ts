import { existsSync } from 'fs';
import { resolve } from 'path';

export function resolveSpec(file?: string): string {
  if (file && existsSync(file)) return resolve(file);
  const def = 'speq.speq';
  if (existsSync(def)) return resolve(def);
  throw new Error('No .speq file specified and speq.speq not found in the current directory.');
}

/**
 * Base name of a .speq path, without directory or the `.speq` suffix.
 * Separator-agnostic: handles both POSIX `/` and Windows `\` regardless of the
 * host platform (a plain `split('/')` silently mangles backslash paths on Windows).
 */
export function specBaseName(specPath: string): string {
  return specPath.replace(/^.*[\\/]/, '').replace(/\.speq$/, '');
}

export function tryResolveSpec(file?: string): string | null {
  if (file && existsSync(file)) return resolve(file);
  const def = 'speq.speq';
  if (existsSync(def)) return resolve(def);
  return null;
}
