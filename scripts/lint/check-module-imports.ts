// Enforces 03_ARCHITECTURE.md Chapter 6.7 / 04_FOLDER_STRUCTURE.md Section
// 19.3's cross-module rules:
//   - Only a module's business/ layer may reach into another module, and
//     only via that module's published contract (module.manifest.ts or
//     index.ts, its re-export) — never another module's business/, domain/,
//     repository/, or presentation/ directly.
//   - common/ may not import any modules/{name}/ folder.
// Intra-module layer legality is enforced separately by
// scripts/lint/check-layer-boundaries.ts.
import { readdirSync, readFileSync, statSync } from "fs";
import { join, relative, dirname, resolve as resolvePath } from "path";
import * as ts from "typescript";

const API_SRC = resolvePath(__dirname, "../../apps/api/src");
const MODULE_ROOTS = [join(API_SRC, "modules"), join(API_SRC, "shared")];
const COMMON_DIR = join(API_SRC, "common");
const PUBLISHED_ENTRY_FILES = ["module.manifest", "index"];

interface Violation {
  file: string;
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

function moduleContaining(modules: { name: string; path: string }[], absPath: string) {
  return modules.find((m) => absPath === m.path || absPath.startsWith(m.path + "/"));
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

function isPublishedEntry(moduleRoot: string, resolved: string): boolean {
  return PUBLISHED_ENTRY_FILES.some(
    (entry) => resolved === join(moduleRoot, entry) || resolved.startsWith(join(moduleRoot, entry) + ".")
  );
}

function main() {
  const modules = listModules();
  const violations: Violation[] = [];

  for (const { name: moduleName, path: moduleRoot } of modules) {
    const files = walk(moduleRoot);
    const topLayer = (filePath: string) => relative(moduleRoot, filePath).split("/")[0];

    for (const file of files) {
      for (const importPath of extractImportSpecifiers(file)) {
        if (!importPath.startsWith(".")) continue; // external/package imports allowed (Section 19.3: any module -> packages/shared-*)

        const resolved = resolvePath(dirname(file), importPath);
        if (resolved.startsWith(moduleRoot)) continue; // same-module import
        if (resolved.startsWith(COMMON_DIR)) continue; // any module -> common/ allowed

        const targetModule = moduleContaining(modules, resolved);
        if (!targetModule) continue; // e.g. database/, outside modules entirely

        const layer = topLayer(file);
        if (layer !== "business") {
          violations.push({
            file: relative(API_SRC, file),
            importPath,
            reason: `only ${moduleName}/business/ may import another module (found in ${layer}/) — Ch.6.7`,
          });
          continue;
        }

        if (!isPublishedEntry(targetModule.path, resolved)) {
          violations.push({
            file: relative(API_SRC, file),
            importPath,
            reason: `must import ${targetModule.name}'s published contract (module.manifest.ts) only, not its internals — Ch.6.5/6.6.1`,
          });
        }
      }
    }

    if (moduleName === "common") continue;
  }

  // common/ may never import a modules/{name}/ folder.
  let commonFiles: string[] = [];
  try {
    commonFiles = walk(COMMON_DIR);
  } catch {
    commonFiles = [];
  }
  for (const file of commonFiles) {
    for (const importPath of extractImportSpecifiers(file)) {
      if (!importPath.startsWith(".")) continue;
      const resolved = resolvePath(dirname(file), importPath);
      if (moduleContaining(modules, resolved)) {
        violations.push({
          file: relative(API_SRC, file),
          importPath,
          reason: "common/ may not import any module-specific folder — Section 19.3",
        });
      }
    }
  }

  if (violations.length === 0) {
    console.log(`Module import boundary check passed (${modules.length} modules scanned).`);
    return;
  }

  console.error(`Module import violations found (${violations.length}):\n`);
  for (const v of violations) {
    console.error(`  ${v.file} imports "${v.importPath}" — ${v.reason}`);
  }
  process.exitCode = 1;
}

main();
