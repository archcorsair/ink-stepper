#!/usr/bin/env bun
/**
 * Syncs the version from package.json into jsr.json.
 *
 * package.json is the single source of truth. Wired into the `version` lifecycle
 * script, which `bun pm version` runs after bumping package.json but before
 * creating the release commit, so the synced jsr.json is staged into that commit
 * and the tagged tree can never carry a stale version. Also safe to run standalone.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const packagePath = join(rootDir, "package.json");
const jsrPath = join(rootDir, "jsr.json");

const packageJson = JSON.parse(readFileSync(packagePath, "utf8")) as { version?: string };
const version = packageJson.version;

if (!version) {
  console.error("sync-versions: package.json has no version field");
  process.exit(1);
}

const jsrJson = JSON.parse(readFileSync(jsrPath, "utf8")) as { version?: string };

if (jsrJson.version === version) {
  console.log(`sync-versions: jsr.json already at ${version}`);
  process.exit(0);
}

jsrJson.version = version;
writeFileSync(jsrPath, `${JSON.stringify(jsrJson, null, 2)}\n`);
console.log(`sync-versions: jsr.json updated to ${version}`);
