import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("../", import.meta.url);
const pluginRoot = new URL(
  "../plugins/codex/open-design-cloud/",
  import.meta.url,
);

function readJson(relativePath) {
  return JSON.parse(readFileSync(new URL(relativePath, root), "utf8"));
}

function readPlugin(relativePath) {
  return readFileSync(new URL(relativePath, pluginRoot), "utf8");
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

test("candidate versions and telemetry compatibility are explicit", () => {
  const packageContract = JSON.parse(
    readPlugin("open-design-cloud.package.json"),
  );
  const pluginManifest = JSON.parse(
    readPlugin(".codex-plugin/plugin.json"),
  );
  const releaseManifest = readJson("release-manifest.json");

  assert.equal(
    packageContract.schemaVersion,
    "open-design-codex-cloud-package/v3",
  );
  assert.equal(packageContract.version, "0.4.0");
  assert.equal(pluginManifest.version, "0.4.0");
  assert.equal(releaseManifest.plugin.version, "0.4.0");
  assert.equal(packageContract.minimumOpenDesignVersion, "0.17.0");
  assert.equal(packageContract.telemetrySchemaVersion, 3);
  assert.equal(releaseManifest.distributionStatus, "unreleased-candidate");
  assert.equal(
    releaseManifest.previousRelease?.plugin?.version,
    "0.3.0",
  );
});

test("capabilities match the real core and mode workflows", () => {
  const packageContract = JSON.parse(
    readPlugin("open-design-cloud.package.json"),
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
    'id: "open-design-cloud"',
    'version: "0.4.0"',
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
  assert.match(skill, /same `pluginWorkflowId`[\s\S]*get_artifact/i);
  assert.match(skill, /get_artifact[\s\S]*optional/i);
  assert.match(skill, /get_artifact[\s\S]*project/i);
  assert.match(skill, /same `requestId`/i);
});

test("portable payload contains no remote MCP, secret, or machine path", () => {
  const files = [
    ".codex-plugin/plugin.json",
    "README.md",
    "open-design-cloud.package.json",
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

test("telemetry document distinguishes candidate implementation from production evidence", () => {
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
  assert.match(telemetry, /not production evidence/i);
  assert.match(telemetry, /destination-specific allowlist\/projection/i);
  assert.match(telemetry, /self.reported/i);
  assert.doesNotMatch(
    telemetry,
    /Vela currently stores the consent-gated Open Design Cloud funnel/i,
  );
});
