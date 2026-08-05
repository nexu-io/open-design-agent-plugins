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
const pluginRoot = join(root, "plugins", "codex", "open-design");

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
  join(pluginRoot, "open-design.package.json"),
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
const skillMetadata = readFileSync(
  join(
    pluginRoot,
    "skills",
    "open-design-mode",
    "agents",
    "openai.yaml",
  ),
  "utf8",
);

assert.equal(packageContract.name, "open-design");
assert.equal(packageContract.version, pluginManifest.version);
assert.equal(packageContract.version, releaseManifest.plugin.version);
assert.equal(packageContract.minimumOpenDesignVersion, "0.17.0");
assert.equal(packageContract.telemetrySchemaVersion, 3);
assert.equal(packageContract.mcpServer, "open-design");
assert.deepEqual(packageContract.customUiResources, [
  {
    uri: "ui://open-design/artifact-card-v5.html",
    mediaType: "text/html;profile=mcp-app",
  },
]);
assert.equal(releaseManifest.distributionStatus, "published-git-marketplace");
assert.deepEqual(releaseManifest.source, {
  repository: "https://github.com/nexu-io/open-design",
  compatibilityRange: ">=0.17.0",
  minimumRelease: {
    version: "0.17.0",
    ref: "refs/tags/open-design-v0.17.0",
    commit: "90a660add511da6408464a1bf3d4d5945ad06400",
  },
  recommendedRelease: {
    version: "0.18.0",
    ref: "refs/heads/release/v0.18.0",
    commit: "1a3cfd0fd625736e8b63249b38163c999b741f36",
    tagObserved: false,
  },
  treeState: "compatible-open-design-runtime-at-or-above-v0.17.0",
});
assert.equal(
  releaseManifest.velaCompatibility.bundledPackage,
  "@powerformer/vela-cli",
);
assert.equal(
  releaseManifest.velaCompatibility.minimumBundledVersion,
  "0.0.27",
);
assert.equal(
  releaseManifest.velaCompatibility.recommendedBundledVersion,
  "0.0.28",
);
assert.equal(
  releaseManifest.validation.compatibleOpenDesignRuntime,
  ">=0.17.0",
);
assert.equal(
  releaseManifest.validation.recommendedOpenDesignRuntime,
  "release/v0.18.0@1a3cfd0fd625736e8b63249b38163c999b741f36",
);
assert.equal(
  releaseManifest.validation.telemetryV3EndToEnd,
  "pending-vela-production-validation-and-controlled-e2e",
);

assert.equal(
  pluginManifest.interface.displayName,
  "Open Design",
);
assert.equal(
  pluginManifest.interface.shortDescription,
  "Create websites, slides, and design systems from Codex.",
);
assert.equal(
  pluginManifest.interface.longDescription,
  "Generate and edit websites, presentations, prototypes, and design systems with Open Design directly from Codex.",
);
assert.equal(
  pluginManifest.interface.supportURL,
  "https://github.com/nexu-io/open-design/issues",
);
assert.deepEqual(pluginManifest.interface.defaultPrompt, [
  "Recreate the Open Design landing page: https://open-design.ai/",
  "Create an academic presentation on generative AI and design.",
  "Create an Apple-style design system with tokens and core components.",
]);
assert.equal(
  pluginManifest.interface.composerIcon,
  "./assets/open-design.png",
);
assert.equal(pluginManifest.interface.logo, "./assets/open-design.png");
assert.equal(existsSync(join(pluginRoot, "assets", "open-design.png")), true);
assert.match(skillMetadata, /display_name: "Create with Open Design"/);
assert.match(
  skillMetadata,
  /short_description: "Generate and refine websites, slides, prototypes, and design systems\."/,
);
assert.equal(
  existsSync(
    join(
      pluginRoot,
      "skills",
      "open-design-mode",
      "assets",
      "open-design.png",
    ),
  ),
  true,
);

const context = packageContract.localMcp.pluginWorkflowContract.context;
assert.deepEqual(Object.keys(context).sort(), [
  "distributionMechanism",
  "id",
  "publisherClass",
  "version",
]);
assert.deepEqual(context, {
  id: "open-design",
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
assert.match(
  skill,
  /Do not end the current task while `get_run` reports `queued` or\s+`running`/i,
);
assert.match(
  skill,
  /prefer the exact `studioUrl`[\s\S]*fall\s+back to the exact `previewUrl`/i,
);
assert.match(
  skill,
  /as soon as the current run first returns a\s+`studioUrl`[\s\S]*host-provided in-app Browser[\s\S]*exactly once/i,
);
assert.match(
  skill,
  /no running-state Studio tab was opened[\s\S]*selected terminal link exactly once before the final response/i,
);
assert.match(
  skill,
  /Never silently switch modes[\s\S]*Switch only after the user\s+explicitly confirms/i,
);
assert.match(
  skill,
  /Every `start_run` for a Local Codex logical generation[\s\S]*`agent: "codex"`/i,
);
assert.match(
  skill,
  /child-runtime boundary[\s\S]*Do not invoke[\s\S]*`open-design` MCP server[\s\S]*Open Design[\s>]*Cloud login/i,
);
assert.match(
  skill,
  /transport retry[\s\S]*byte-identical prompt including the child-runtime boundary/i,
);
assert.match(
  skill,
  /Before every `collect_brief` call[\s\S]*normalized BCP-47 `locale`[\s\S]*current message/i,
);

assert.equal(
  contentListDigest(pluginRoot),
  releaseManifest.plugin.contentListSha256,
);
assert.equal(marketplace.name, "open-design");
assert.equal(marketplace.plugins.length, 1);
assert.equal(marketplace.plugins[0].name, "open-design");
assert.equal(
  marketplace.plugins[0].source.path,
  "./plugins/codex/open-design",
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
