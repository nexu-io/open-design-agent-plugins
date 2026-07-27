import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
} from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));
const pluginRoot = join(root, "plugins", "codex", "open-design-cloud");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function walkFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`symlink is not allowed in distribution payload: ${path}`);
    }
    if (entry.isDirectory()) {
      files.push(...walkFiles(path));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
}

function contentListDigest(directory) {
  const lines = walkFiles(directory)
    .map((path) => ({
      path,
      relativePath: relative(directory, path).split(sep).join("/"),
    }))
    .sort((left, right) =>
      Buffer.compare(
        Buffer.from(left.relativePath),
        Buffer.from(right.relativePath),
      ),
    )
    .map(({ path, relativePath }) => {
      const digest = createHash("sha256")
        .update(readFileSync(path))
        .digest("hex");
      return `${digest}  ./${relativePath}\n`;
    })
    .join("");
  return createHash("sha256").update(lines).digest("hex");
}

const packageContract = readJson(
  join(pluginRoot, "open-design-cloud.package.json"),
);
const pluginManifest = readJson(
  join(pluginRoot, ".codex-plugin", "plugin.json"),
);
const releaseManifest = readJson(join(root, "release-manifest.json"));
const marketplace = readJson(
  join(root, ".agents", "plugins", "marketplace.json"),
);
const skill = readFileSync(
  join(pluginRoot, "skills", "open-design-mode", "SKILL.md"),
  "utf8",
);

assert.equal(packageContract.name, "open-design-cloud");
assert.equal(packageContract.version, pluginManifest.version);
assert.equal(packageContract.version, releaseManifest.plugin.version);
assert.equal(packageContract.minimumOpenDesignVersion, "0.17.0");
assert.equal(packageContract.telemetrySchemaVersion, 3);
assert.equal(packageContract.mcpServer, "open-design");
assert.equal(releaseManifest.distributionStatus, "unreleased-candidate");
assert.equal(releaseManifest.previousRelease.plugin.version, "0.3.0");

const context = packageContract.localMcp.pluginWorkflowContract.context;
assert.deepEqual(Object.keys(context).sort(), [
  "distributionMechanism",
  "id",
  "publisherClass",
  "version",
]);
assert.deepEqual(context, {
  id: "open-design-cloud",
  version: packageContract.version,
  distributionMechanism: "git_marketplace",
  publisherClass: "open_design_first_party",
});
assert.equal(
  packageContract.localMcp.pluginWorkflowContract.firstObservedTool,
  "collect_brief",
);

const coreTools = [
  "collect_brief",
  "confirm_brief",
  "get_active_context",
  "list_projects",
  "create_project",
  "start_run",
  "get_run",
];
const capability = packageContract.localMcp.capabilities;
const sorted = (values) => [...values].sort();
assert.deepEqual(sorted(capability.core.requiredTools), sorted(coreTools));
assert.deepEqual(
  sorted(capability.cloud.requiredTools),
  sorted([
    ...coreTools,
    "get_vela_login_status",
    "start_vela_login",
    "list_agents",
  ]),
);
assert.deepEqual(
  sorted(capability.localCodex.requiredTools),
  sorted([...coreTools, "list_agents"]),
);
assert.deepEqual(
  sorted(capability.byok.requiredTools),
  sorted([...coreTools, "list_byok_profiles"]),
);
assert.deepEqual(capability.optional.tools, ["get_artifact"]);
assert.equal(capability.optional.requiredForDefaultDelivery, false);
assert.equal(packageContract.localMcp.requiredTools, undefined);

assert.match(skill, /externalPluginContext/);
assert.match(skill, /same `pluginWorkflowId`[\s\S]*get_artifact/i);
assert.match(skill, /same `requestId`/i);
assert.match(skill, /Open Design 0\.17\.0 or newer/);

assert.equal(
  contentListDigest(pluginRoot),
  releaseManifest.plugin.contentListSha256,
);
assert.equal(marketplace.name, "open-design");
assert.equal(marketplace.plugins.length, 1);
assert.equal(marketplace.plugins[0].name, "open-design-cloud");
assert.equal(
  marketplace.plugins[0].source.path,
  "./plugins/codex/open-design-cloud",
);

assert.equal(existsSync(join(pluginRoot, ".mcp.json")), false);
assert.equal(existsSync(join(pluginRoot, "scripts")), false);

const scannedRoots = [
  join(root, "AGENTS.md"),
  join(root, "AGENT_PROMPT.md"),
  join(root, "README.md"),
  join(root, "docs"),
  pluginRoot,
  join(root, "release-manifest.json"),
];
const scanFiles = scannedRoots.flatMap((path) =>
  lstatSync(path).isDirectory() ? walkFiles(path) : [path],
);
const allText = scanFiles
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");

assert.doesNotMatch(allText, /mcp\.open-design\.ai/i);
assert.doesNotMatch(allText, /https:\/\/[^\s"'`]*\/mcp(?:\b|\/)/i);
assert.doesNotMatch(
  allText,
  /\b(?:sk|pk)-(?:proj|or|live|test)-[A-Za-z0-9_-]+/,
);
assert.doesNotMatch(allText, /\/Users\/[^/\s]+/);
assert.doesNotMatch(allText, /\/home\/[^/\s]+/);
assert.doesNotMatch(allText, /[A-Za-z]:\\Users\\/);

console.log(
  `validated ${pluginManifest.name}@${pluginManifest.version}: mode-aware local MCP payload, telemetry v3 contract, and portable safety checks passed`,
);
