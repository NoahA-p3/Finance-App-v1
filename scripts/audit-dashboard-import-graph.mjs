#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const srcRoot = path.join(repoRoot, "src");
const appRoot = path.join(srcRoot, "app");

const auditedTargets = [
  "src/components/dashboard",
  "src/components/dashboard-ui",
];

const sourceExtensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const importRegexes = [
  /import\s+(?:[^"'`]*?from\s+)?["'`]([^"'`]+)["'`]/g,
  /export\s+(?:[^"'`]*?from\s+)["'`]([^"'`]+)["'`]/g,
  /import\(\s*["'`]([^"'`]+)["'`]\s*\)/g,
];

function listFilesRecursively(startDir) {
  const collected = [];
  const stack = [startDir];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || !fs.existsSync(current)) continue;

    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        stack.push(fullPath);
      } else if (entry.isFile()) {
        if (sourceExtensions.includes(path.extname(entry.name))) {
          collected.push(fullPath);
        }
      }
    }
  }

  return collected;
}

function fileExistsWithExtensions(basePath) {
  if (fs.existsSync(basePath) && fs.statSync(basePath).isFile()) {
    return basePath;
  }

  for (const ext of sourceExtensions) {
    const withExt = `${basePath}${ext}`;
    if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
      return withExt;
    }
  }

  for (const ext of sourceExtensions) {
    const indexFile = path.join(basePath, `index${ext}`);
    if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) {
      return indexFile;
    }
  }

  return null;
}

function resolveImport(fromFile, specifier) {
  if (!specifier) return null;

  let candidate;

  if (specifier.startsWith("@/")) {
    candidate = path.join(srcRoot, specifier.slice(2));
  } else if (specifier.startsWith("./") || specifier.startsWith("../")) {
    candidate = path.resolve(path.dirname(fromFile), specifier);
  } else {
    return null;
  }

  const resolved = fileExistsWithExtensions(candidate);
  if (!resolved) return null;

  const normalized = path.normalize(resolved);
  if (!normalized.startsWith(srcRoot)) return null;

  return normalized;
}

function getImports(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const imports = new Set();

  for (const regex of importRegexes) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const specifier = match[1];
      const resolved = resolveImport(filePath, specifier);
      if (resolved) imports.add(resolved);
    }
  }

  return [...imports];
}

function toRelative(fullPath) {
  return path.relative(repoRoot, fullPath).replaceAll(path.sep, "/");
}

function main() {
  if (!fs.existsSync(appRoot)) {
    console.error("Expected src/app to exist.");
    process.exit(1);
  }

  const appFiles = listFilesRecursively(appRoot);
  const targetFiles = auditedTargets.flatMap((targetDir) => {
    const absoluteDir = path.join(repoRoot, targetDir);
    return listFilesRecursively(absoluteDir);
  });

  const visited = new Set();
  const queue = [...appFiles];

  while (queue.length > 0) {
    const file = queue.shift();
    if (!file || visited.has(file)) continue;

    visited.add(file);
    for (const imported of getImports(file)) {
      if (!visited.has(imported)) queue.push(imported);
    }
  }

  const reachableTargets = targetFiles.filter((file) => visited.has(file));
  const unreachableTargets = targetFiles.filter((file) => !visited.has(file));

  console.log("Dashboard import-graph audit");
  console.log(`- Entrypoint files scanned from src/app: ${appFiles.length}`);
  console.log(`- Reachable source files from src/app graph: ${visited.size}`);
  console.log(`- Audited target files: ${targetFiles.length}`);
  console.log(`- Reachable target files: ${reachableTargets.length}`);
  console.log(`- Unreachable target files: ${unreachableTargets.length}`);

  if (reachableTargets.length > 0) {
    console.log("\nReachable target files (investigate before retiring):");
    for (const file of reachableTargets) {
      console.log(`  - ${toRelative(file)}`);
    }
    process.exit(1);
  }

  if (unreachableTargets.length > 0) {
    console.log("\nUnreachable target files:");
    for (const file of unreachableTargets) {
      console.log(`  - ${toRelative(file)}`);
    }
  }

  console.log("\nPASS: No audited dashboard target files are reachable from src/app.");
}

main();
