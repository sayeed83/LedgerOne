// Enforces 03_ARCHITECTURE.md Decision 5.7.1 / 04_FOLDER_STRUCTURE.md
// Section 19.3's intra-module layer rules:
//   presentation/ -> business/ only
//   business/     -> domain/, repository/ (own module only)
//   domain/       -> nothing outside itself, zero exceptions
//   repository/   -> domain/, database/ (own module only)
// Cross-module import legality is enforced separately by
// scripts/lint/check-module-imports.ts.
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative, dirname, resolve as resolvePath } from "path";
import * as ts from "typescript";

const API_SRC = resolvePath(__dirname, "../../apps/api/src");
const MODULE_ROOTS = [join(API_SRC, "modules"), join(API_SRC, "shared")];
const LAYERS = ["presentation", "business", "domain", "repository"] as const;
type Layer = (typeof LAYERS)[number];

const ALLOWED_TARGET_LAYERS: Record<Layer, Layer[]> = {
  presentation: ["business"],
  business: ["domain", "repository"],
  domain: [],
  repository: ["domain"],
};

interface Violation {
  file: string;
  layer: Layer;
  importPath: string;
  reason: string;
}

function walk(dir: string): string[] {
  let results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) results = results.concat(walk(full));
    else if (entry.endsWith(".ts") || entry.endsWith(".tsx")) results.push(full);
  }
  return results;
}

function listModules(): { name: string; path: string }[] {
  const modules: { name: string; path: string }[] = [];
  for (const root of MODULE_ROOTS) {
    let entries: string[] = [];
    try {
      entries = readdirSync(root);
    } catch {
      continue;
    }
    for (const name of entries) {
      const path = join(root, name);
      if (statSync(path).isDirectory()) modules.push({ name, path });
    }
  }
  return modules;
}

function layerOf(moduleRoot: string, filePath: string): Layer | null {
  const rel = relative(moduleRoot, filePath);
  const top = rel.split("/")[0];
  return (LAYERS as readonly string[]).includes(top) ? (top as Layer) : null;
}

function extractImportSpecifiers(filePath: string): string[] {
  const source = readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const specifiers: string[] = [];

  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "require" &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      specifiers.push((node.arguments[0] as ts.StringLiteral).text);
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

function checkModule(moduleName: string, moduleRoot: string): Violation[] {
  const violations: Violation[] = [];

  for (const layer of LAYERS) {
    const layerDir = join(moduleRoot, layer);
    let files: string[] = [];
    try {
      files = walk(layerDir);
    } catch {
      continue;
    }

    for (const file of files) {
      for (const importPath of extractImportSpecifiers(file)) {
        if (layer === "domain") {
          if (!importPath.startsWith(".")) {
            violations.push({
              file: relative(moduleRoot, file),
              layer,
              importPath,
              reason:
                "domain/ may not import anything outside itself (Ch.5.7.1 — zero exceptions)",
            });
            continue;
          }
          const resolved = resolvePath(dirname(file), importPath);
          if (!resolved.startsWith(join(moduleRoot, "domain"))) {
            violations.push({
              file: relative(moduleRoot, file),
              layer,
              importPath,
              reason:
                "domain/ may not import anything outside itself (Ch.5.7.1 — zero exceptions)",
            });
          }
          continue;
        }

        if (!importPath.startsWith(".")) continue; // external/package imports checked elsewhere
        const resolved = resolvePath(dirname(file), importPath);
        if (!resolved.startsWith(moduleRoot)) continue; // cross-module: check-module-imports.ts's concern

        const targetLayer = layerOf(moduleRoot, resolved);
        if (targetLayer && targetLayer !== layer && !ALLOWED_TARGET_LAYERS[layer].includes(targetLayer)) {
          violations.push({
            file: relative(moduleRoot, file),
            layer,
            importPath,
            reason: `${layer}/ may not import ${targetLayer}/ directly (Section 19.3)`,
          });
        }
      }
    }
  }

  return violations;
}

function main() {
  const modules = listModules();
  const allViolations: Violation[] = [];

  for (const { name, path } of modules) {
    allViolations.push(...checkModule(name, path));
  }

  if (allViolations.length === 0) {
    console.log(`Layer boundary check passed (${modules.length} modules scanned).`);
    return;
  }

  console.error(`Layer boundary violations found (${allViolations.length}):\n`);
  for (const v of allViolations) {
    console.error(`  ${v.file} [${v.layer}/] imports "${v.importPath}" — ${v.reason}`);
  }
  process.exitCode = 1;
}

main();
