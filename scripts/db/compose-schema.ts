// Composes the per-module Prisma schema files under
// apps/api/src/database/schema/ (06_DATABASE_STANDARDS.md) into a single
// generated schema Prisma's CLI can consume. `base.prisma` (datasource +
// generator + shared base fields) always comes first; the remaining module
// files are concatenated in alphabetical order so the composed output is
// deterministic across runs.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SCHEMA_DIR = join(__dirname, "../../apps/api/src/database/schema");
const OUTPUT_DIR = join(__dirname, "../../apps/api/src/database/generated");
const OUTPUT_FILE = join(OUTPUT_DIR, "schema.prisma");
const BASE_FILE = "base.prisma";

function composeSchema(): string {
  const files = readdirSync(SCHEMA_DIR).filter((f) => f.endsWith(".prisma"));
  const ordered = [
    ...files.filter((f) => f === BASE_FILE),
    ...files.filter((f) => f !== BASE_FILE).sort(),
  ];

  const header =
    "// GENERATED FILE — do not edit directly.\n" +
    "// Composed by scripts/db/compose-schema.ts from apps/api/src/database/schema/*.prisma\n\n";

  const body = ordered
    .map((file) => {
      const contents = readFileSync(join(SCHEMA_DIR, file), "utf-8").trim();
      return `// ---- source: database/schema/${file} ----\n${contents}\n`;
    })
    .join("\n");

  return header + body;
}

function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_FILE, composeSchema());
  console.log(`Composed schema written to ${OUTPUT_FILE}`);
}

main();
