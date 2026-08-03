// Discovers and runs seed modules under apps/api/src/database/seeds/.
// Platform seeds (reference/lookup data every environment needs) always run;
// development seeds (sample tenant data) run unless NODE_ENV=production.
// Each seed file is named `{purpose}.seed.ts` and exports a default async
// `seed()` function; files run in filename order within their directory.
import { readdirSync } from "fs";
import { join } from "path";

const SEEDS_ROOT = join(__dirname, "../../apps/api/src/database/seeds");

async function runDirectory(dir: string): Promise<void> {
  let files: string[] = [];
  try {
    files = readdirSync(dir)
      .filter((f) => f.endsWith(".seed.ts"))
      .sort();
  } catch {
    console.log(`No seeds directory at ${dir}, skipping.`);
    return;
  }

  if (files.length === 0) {
    console.log(`No seed files found in ${dir}.`);
    return;
  }

  for (const file of files) {
    const modulePath = join(dir, file);
    console.log(`==> Running seed: ${file}`);
    const mod = await import(modulePath);
    if (typeof mod.seed !== "function") {
      throw new Error(`${file} must export an async function named "seed"`);
    }
    await mod.seed();
  }
}

async function main(): Promise<void> {
  await runDirectory(join(SEEDS_ROOT, "platform"));
  if (process.env.NODE_ENV !== "production") {
    await runDirectory(join(SEEDS_ROOT, "development"));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
