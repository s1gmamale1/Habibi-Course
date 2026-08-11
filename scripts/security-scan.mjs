import { spawnSync } from "node:child_process";

const EXPECTED_VERSION = "ruflo v3.34.0";

function runRuflo(args, stdio = "inherit") {
  const result = spawnSync("ruflo", args, { encoding: "utf8", stdio });
  if (result.error) {
    throw new Error(`Unable to run Ruflo: ${result.error.message}`);
  }
  return result;
}

const versionResult = runRuflo(["--version"], "pipe");
const actualVersion = versionResult.stdout.trim();

if (versionResult.status !== 0 || actualVersion !== EXPECTED_VERSION) {
  throw new Error(
    `Security scans require ${EXPECTED_VERSION}; found ${actualVersion || "no usable Ruflo installation"}`,
  );
}

const scans = [
  ["security", "scan", "--target", ".", "--type", "deps", "--depth", "deep"],
  ["security", "scan", "--target", "./src", "--type", "code", "--depth", "deep"],
];

for (const args of scans) {
  const result = runRuflo(args);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
