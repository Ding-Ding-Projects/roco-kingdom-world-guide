import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const providedTime = process.env.ROCO_GUIDE_BUILD_AT;
let builtAt;
if (providedTime) {
  const parsed = new Date(providedTime);
  if (!Number.isFinite(parsed.getTime())) throw new Error("ROCO_GUIDE_BUILD_AT must be a valid ISO 8601 timestamp.");
  builtAt = parsed.toISOString();
} else {
  builtAt = new Date().toISOString();
}

function gitOutput(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
  return result.status === 0 ? result.stdout.trim() : null;
}

const headRevision = gitOutput(["rev-parse", "--verify", "HEAD"]);
const checkoutStatus = gitOutput(["status", "--porcelain", "--untracked-files=normal"]);
const eventRevision = process.env.GITHUB_SHA || null;
const sourceAvailable = Boolean(headRevision && checkoutStatus === "" && (!eventRevision || eventRevision === headRevision));
const revision = sourceAvailable ? headRevision : null;
const sourceBranch = sourceAvailable
  ? process.env.GITHUB_REF_NAME || gitOutput(["rev-parse", "--abbrev-ref", "HEAD"])
  : null;
const provenance = {
  schemaVersion: 1,
  version: packageJson.version,
  builtAt,
  sourceRevision: revision,
  sourceBranch: sourceBranch && sourceBranch !== "HEAD" ? sourceBranch : null,
  sourceState: sourceAvailable ? (eventRevision ? "clean-checkout" : "local-build") : "unavailable",
  source: process.env.GITHUB_RUN_ID ? "GitHub Actions" : "local build process"
};

const output = path.join(root, "dist", "data", "build-info.json");
await writeFile(output, `${JSON.stringify(provenance, null, 2)}\n`, "utf8");
process.stdout.write(`Recorded version ${provenance.version}, build time ${provenance.builtAt}, source ${provenance.sourceRevision || "unavailable"}.\n`);
