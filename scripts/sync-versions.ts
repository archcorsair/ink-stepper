#!/usr/bin/env bun
/**
 * Syncs the version from package.json into jsr.json.
 *
 * package.json is the single source of truth. Wired into the `version` lifecycle
 * script, which `bun pm version` runs after bumping package.json but before
 * creating the release commit, so the synced jsr.json is staged into that commit
 * and the tagged tree can never carry a stale version. Also safe to run standalone.
 *
 * The rewrite is a targeted regex replacement of the "version" field only - NOT a
 * JSON.parse/stringify round-trip - so the rest of the file's formatting is
 * preserved byte for byte. (A stringify round-trip once reformatted the
 * publish.exclude array, which made the release commit fail lint and blocked a
 * publish.)
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

const jsrText = readFileSync(jsrPath, "utf8");
const currentMatch = jsrText.match(/"version"\s*:\s*"([^"]*)"/);

if (!currentMatch) {
  console.error('sync-versions: could not find a "version" field in jsr.json');
  process.exit(1);
}

if (currentMatch[1] === version) {
  console.log(`sync-versions: jsr.json already at ${version}`);
  process.exit(0);
}

const updated = jsrText.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`);
writeFileSync(jsrPath, updated);
console.log(`sync-versions: jsr.json updated to ${version}`);
