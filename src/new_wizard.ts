import { getWorkdir } from './global_config.js';

export async function run(): Promise<void> {
  const { run: buildRun } = await import('./build_cmd.js');
  await buildRun(undefined, true, getWorkdir());
}
