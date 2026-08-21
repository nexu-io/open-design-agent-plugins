import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
const pluginRoot = new URL(
  "../plugins/codex/open-design/",
  import.meta.url,
);

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, root), "utf8"));
}

function readPlugin(relativePath) {
  return readFileSync(new URL(relativePath, pluginRoot), "utf8");
}

function readPluginBuffer(relativePath) {
  return readFileSync(new URL(relativePath, pluginRoot));
}

const coreTools = [
  "collect_brief",
  "confirm_brief",
  "get_active_context",
  "list_projects",
  "create_project",
  "start_run",
  "get_run",
];

function sorted(values) {
  return [...values].sort();
}

test("published versions and runtime compatibility are explicit", () => {
  const packageContract = JSON.parse(
    readPlugin("open-design.package.json"),
  );
  const pluginManifest = JSON.parse(
    readPlugin(".codex-plugin/plugin.json"),
  );
  const releaseManifest = readJson("release-manifest.json");

  assert.equal(
    packageContract.schemaVersion,
    "open-design-codex-cloud-package/v3",
  );
  assert.equal(packageContract.version, "0.5.3");
  assert.equal(pluginManifest.version, "0.5.3");
  assert.equal(releaseManifest.plugin.version, "0.5.3");
  assert.equal(packageContract.minimumOpenDesignVersion, "0.17.0");
  assert.equal(packageContract.telemetrySchemaVersion, 3);
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
});

test("capabilities match the real core and mode workflows", () => {
  const packageContract = JSON.parse(
    readPlugin("open-design.package.json"),
  );
  const capabilities = packageContract.localMcp.capabilities;

  assert.equal(packageContract.localMcp.requiredTools, undefined);
  assert.deepEqual(
    sorted(capabilities.core.requiredTools),
    sorted(coreTools),
  );
  assert.deepEqual(
    sorted(capabilities.cloud.requiredTools),
    sorted([
      ...coreTools,
      "get_vela_login_status",
      "start_vela_login",
      "list_agents",
    ]),
  );
  assert.deepEqual(
    sorted(capabilities.localCodex.requiredTools),
    sorted([...coreTools, "list_agents"]),
  );
  assert.deepEqual(
    sorted(capabilities.byok.requiredTools),
    sorted([...coreTools, "list_byok_profiles"]),
  );
  assert.deepEqual(capabilities.optional.tools, ["get_artifact"]);
  assert.equal(capabilities.optional.requiredForDefaultDelivery, false);
});

test("skill carries one bounded plugin workflow through delivery", () => {
  const skill = readPlugin("skills/open-design-mode/SKILL.md");

  for (const requiredFragment of [
    'id: "open-design"',
    'version: "0.5.3"',
    'distributionMechanism: "git_marketplace"',
    'publisherClass: "open_design_first_party"',
    "externalPluginContext",
    "pluginWorkflowId",
    "requestId",
    "collect_brief",
    "get_artifact",
  ]) {
    assert.match(skill, new RegExp(requiredFragment));
  }

  assert.match(
    skill,
    /externalPluginContext[\s\S]*collect_brief[\s\S]*skip: true/i,
  );
  assert.match(skill, /call `collect_brief` exactly once/i);
  assert.match(skill, /wait for that same card/i);
  assert.match(skill, /sandbox failed to load[\s\S]*do not call[\s\S]*again/i);
  assert.match(skill, /questionForm[\s\S]*plain-text\s+question/i);
  assert.match(skill, /original `briefDraftId`, `nonce`/i);
  assert.match(skill, /same `pluginWorkflowId`[\s\S]*get_artifact/i);
  assert.match(skill, /get_artifact[\s\S]*optional/i);
  assert.match(skill, /get_artifact[\s\S]*project/i);
  assert.match(skill, /same `requestId`/i);
});

test("public plugin and skill metadata match the approved acceptance copy", () => {
  const pluginManifest = JSON.parse(
    readPlugin(".codex-plugin/plugin.json"),
  );
  const skill = readPlugin("skills/open-design-mode/SKILL.md");
  const skillMetadata = readPlugin(
    "skills/open-design-mode/agents/openai.yaml",
  );

  assert.equal(
    pluginManifest.interface.displayName,
    "OpenDesign",
  );
  assert.equal(
    pluginManifest.interface.shortDescription,
    "Create websites, slides, and design systems from Codex.",
  );
  assert.equal(
    pluginManifest.interface.longDescription,
    "Generate and edit websites, presentations, prototypes, and design systems with OpenDesign directly from Codex.",
  );
  assert.equal(
    pluginManifest.interface.supportURL,
    "https://github.com/nexu-io/open-design/issues",
  );
  assert.deepEqual(pluginManifest.interface.defaultPrompt, [
    "Recreate the OpenDesign landing page: https://open-design.ai/",
    "Create an academic presentation on generative AI and design.",
    "Create an Apple-style design system with tokens and core components.",
  ]);
  assert.match(skillMetadata, /display_name: "Create with OpenDesign"/);
  assert.match(
    skillMetadata,
    /short_description: "Generate and refine websites, slides, prototypes, and design systems\."/,
  );
  assert.match(
    skillMetadata,
    /default_prompt: "Use \$open-design-mode to create or refine an OpenDesign artifact\."/,
  );

  const frontmatter = skill.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const publicMetadata = [
    pluginManifest.description,
    pluginManifest.interface.shortDescription,
    pluginManifest.interface.longDescription,
    skillMetadata,
    frontmatter,
  ].join("\n");
  assert.doesNotMatch(publicMetadata, /\b(?:Vela|AMR|amr)\b|agent\s*:/i);
});

test("official OpenDesign artwork is packaged for plugin and skill surfaces", () => {
  const pluginManifest = JSON.parse(
    readPlugin(".codex-plugin/plugin.json"),
  );
  assert.equal(
    pluginManifest.interface.composerIcon,
    "./assets/open-design.png",
  );
  assert.equal(pluginManifest.interface.logo, "./assets/open-design.png");

  for (const relativePath of [
    "assets/open-design.png",
    "skills/open-design-mode/assets/open-design.png",
  ]) {
    assert.equal(existsSync(new URL(relativePath, pluginRoot)), true);
    const image = readPluginBuffer(relativePath);
    assert.equal(image.subarray(1, 4).toString("ascii"), "PNG");
  }
});

test("skill keeps one run alive and proactively opens terminal delivery when supported", () => {
  const skill = readPlugin("skills/open-design-mode/SKILL.md");

  assert.match(
    skill,
    /Do not end the current task while `get_run` reports `queued` or\s+`running`/i,
  );
  assert.match(
    skill,
    /Continue polling the same `runId`[\s\S]*30–60 seconds/i,
  );
  assert.match(
    skill,
    /Never promise that a later message will arrive after the current task\s+ends/i,
  );
  assert.match(
    skill,
    /prefer the exact `studioUrl`[\s\S]*fall\s+back to the exact `previewUrl`/i,
  );
  assert.match(
    skill,
    /neither URL[\s\S]*do not claim complete delivery/i,
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
    /required delivery fallback[\s\S]*not an\s+optional suggestion[\s\S]*must not wait for the user/i,
  );
  assert.match(
    skill,
    /Codex CLI[\s\S]*Browser capability is unavailable[\s\S]*clickable link/i,
  );
});

test("skill preserves an explicit mode until the user confirms a switch", () => {
  const skill = readPlugin("skills/open-design-mode/SKILL.md");

  assert.match(
    skill,
    /Resolve the execution mode[\s\S]*before calling\s+`collect_brief`/i,
  );
  assert.match(
    skill,
    /remains selected through Brief collection[\s\S]*terminal delivery/i,
  );
  assert.match(
    skill,
    /Never silently switch modes[\s\S]*Switch only after the user\s+explicitly confirms/i,
  );
  assert.match(
    skill,
    /Local Codex[\s\S]*Do not call `get_vela_login_status` or `start_vela_login`/i,
  );
  assert.match(
    skill,
    /Every `start_run` for a Local Codex logical generation[\s\S]*`agent: "codex"`/i,
  );
  assert.match(
    skill,
    /child-runtime boundary[\s\S]*Do not invoke[\s\S]*`open-design` MCP server[\s\S]*OpenDesign[\s>]*Cloud login/i,
  );
  assert.match(
    skill,
    /transport retry[\s\S]*byte-identical prompt including the child-runtime boundary/i,
  );
  assert.match(
    skill,
    /out of quota[\s\S]*offer[\s\S]*switch explicitly[\s\S]*Never invoke either alternative until the user confirms/i,
  );
});

test("skill passes the current user language to every brief collection", () => {
  const skill = readPlugin("skills/open-design-mode/SKILL.md");

  assert.match(
    skill,
    /Before every `collect_brief` call[\s\S]*normalized BCP-47 `locale`[\s\S]*current message/i,
  );
  assert.match(skill, /`zh-CN`[\s\S]*Simplified Chinese request/i);
  assert.match(skill, /`en`[\s\S]*English request/i);
  assert.match(
    skill,
    /Host UI locale only when the current message language is genuinely\s+indeterminate[\s\S]*fall back to `en`/i,
  );
});

test("portable payload contains no remote MCP, secret, or machine path", () => {
  const files = [
    ".codex-plugin/plugin.json",
    "README.md",
    "open-design.package.json",
    "skills/open-design-mode/SKILL.md",
  ];
  const content = files
    .map((file) => readPlugin(file))
    .join("\n");

  assert.doesNotMatch(content, /mcp\.open-design\.ai/i);
  assert.doesNotMatch(content, /https:\/\/[^\s"'`]*\/mcp(?:\b|\/)/i);
  assert.doesNotMatch(content, /\b(?:sk|pk)-(?:proj|or|live|test)-[A-Za-z0-9_-]+/);
  assert.doesNotMatch(content, /\/Users\/[^/\s]+/);
  assert.doesNotMatch(content, /\/home\/[^/\s]+/);
  assert.doesNotMatch(content, /[A-Za-z]:\\Users\\/);
});

test("telemetry document distinguishes the released runtime from production evidence", () => {
  const telemetry = readFileSync(
    join(new URL("../docs/", import.meta.url).pathname, "TELEMETRY.md"),
    "utf8",
  );

  assert.match(telemetry, /official_installs.*N\/A.*source_unavailable/is);
  assert.match(telemetry, /general.*analytics/i);
  assert.match(
    telemetry,
    /compatible Vela candidate branch[\s\S]*bounded Plugin correlation/i,
  );
  assert.match(
    telemetry,
    /OpenDesign 0\.17\.0 and later[\s\S]*telemetry schema v3/i,
  );
  assert.match(telemetry, /recommended `release\/v0\.18\.0` branch/i);
  assert.match(telemetry, /not production\s+evidence/i);
  assert.match(telemetry, /destination-specific allowlist\/projection/i);
  assert.match(telemetry, /self.reported/i);
  assert.doesNotMatch(
    telemetry,
    /Vela currently stores the consent-gated OpenDesign Cloud funnel/i,
  );
});
