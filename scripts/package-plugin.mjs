/*
 * Build a host-specific plugin upload archive from a generated payload root.
 *
 * The payload under `plugins/<host>/<plugin>/` is NOT portable across hosts:
 * its manifest directory (`.codex-plugin/`), package contract schema
 * (`open-design-codex-cloud-package/v3`), and per-skill agent interface file
 * (`agents/openai.yaml`) are all host conventions. This script therefore
 * refuses to package a host it has no explicit rules for, and refuses a
 * payload that carries another host's interface file.
 *
 * Output is deterministic: entries are emitted in a stable C-collation order
 * with mtimes normalized to `release-manifest.json`'s `generatedAt`, so the
 * same reviewed tree always produces the same archive digest.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  utimesSync,
} from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../", import.meta.url)));

/**
 * Per-host packaging rules. A host is packageable only when every field here
 * is known for it — guessing a manifest path or interface filename would
 * produce an archive that silently fails host ingestion.
 */
const HOSTS = {
  codex: {
    label: "Codex / OpenAI plugin marketplace",
    manifestPath: ".codex-plugin/plugin.json",
    packageContractSuffix: ".package.json",
    packageContractSchema: "open-design-codex-cloud-package/v3",
    agentInterfaceFile: "openai.yaml",
    // 0.5.2 was submitted to the Portal without a host token in the filename.
    // Keep that name for Codex so submission records stay continuous; every
    // host added later gets the host-qualified default below.
    artifactName: ({ pluginName, version }) => `${pluginName}-plugin-${version}.zip`,
  },
};

const DEFAULT_ARTIFACT_NAME = ({ pluginName, host, version }) =>
  `${pluginName}-${host}-plugin-${version}.zip`;

const FORBIDDEN_MEMBERS = new Set([".DS_Store", "Thumbs.db", "desktop.ini"]);
const FORBIDDEN_PREFIXES = ["__MACOSX"];

function fail(message) {
  throw new Error(message);
}

function parseArgs(argv) {
  const options = {
    host: "codex",
    plugin: null,
    outDir: join(".tmp", "plugin-upload"),
    skipGates: false,
    json: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (value === undefined) fail(`${arg} requires a value`);
      index += 1;
      return value;
    };
    if (arg === "--host") options.host = next();
    else if (arg === "--plugin") options.plugin = next();
    else if (arg === "--out-dir") options.outDir = next();
    else if (arg === "--skip-gates") options.skipGates = true;
    else if (arg === "--json") options.json = true;
    else if (arg === "-h" || arg === "--help") options.help = true;
    else fail(`unknown argument: ${arg}`);
  }
  return options;
}

function usage() {
  return [
    "Usage: node scripts/package-plugin.mjs [options]",
    "",
    "  --host <name>      host payload to package (default: codex)",
    "  --plugin <name>    plugin directory under plugins/<host>/ (default: the only one)",
    "  --out-dir <path>   archive destination (default: .tmp/plugin-upload)",
    "  --skip-gates       skip the distribution validator and package tests",
    "  --json             emit a machine-readable result",
    "",
    `Known hosts: ${Object.keys(HOSTS).join(", ")}`,
  ].join("\n");
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Walk every regular file, rejecting symlinks the way the distribution validator does. */
function walkFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) fail(`symlink is not allowed in a plugin payload: ${path}`);
    if (entry.isDirectory()) files.push(...walkFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const byBytes = (left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right));

function payloadMembers(payloadRoot) {
  return walkFiles(payloadRoot)
    .map((path) => relative(payloadRoot, path).split(sep).join("/"))
    .sort(byBytes);
}

/**
 * Explicit directory entries, as `zip -r` would emit them. The 0.5.2 archive
 * that passed host ingestion carried them, so they are reproduced rather than
 * dropped, even though most unzip implementations create directories
 * implicitly.
 */
function payloadDirectoryEntries(members) {
  const directories = new Set();
  for (const member of members) {
    const parts = member.split("/");
    for (let depth = 1; depth < parts.length; depth += 1) {
      directories.add(`${parts.slice(0, depth).join("/")}/`);
    }
  }
  return [...directories].sort(byBytes);
}

/** Identical to contentListDigest() in scripts/validate-distribution.mjs. */
function contentListDigest(payloadRoot, members) {
  const lines = members
    .map((member) => {
      const digest = createHash("sha256")
        .update(readFileSync(join(payloadRoot, member)))
        .digest("hex");
      return `${digest}  ./${member}\n`;
    })
    .join("");
  return createHash("sha256").update(lines).digest("hex");
}

function resolvePayloadRoot(host, requestedPlugin) {
  const hostRoot = join(root, "plugins", host);
  if (!existsSync(hostRoot)) {
    fail(
      `no payload directory for host "${host}" at plugins/${host}/. ` +
        "Host payloads are added only when a validated host-specific package " +
        'exists — see "Host directory convention" in AGENTS.md.',
    );
  }
  const candidates = readdirSync(hostRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  if (requestedPlugin) {
    if (!candidates.includes(requestedPlugin)) {
      fail(`plugin "${requestedPlugin}" not found under plugins/${host}/ (have: ${candidates.join(", ") || "none"})`);
    }
    return join(hostRoot, requestedPlugin);
  }
  if (candidates.length === 0) fail(`plugins/${host}/ contains no plugin directory`);
  if (candidates.length > 1) {
    fail(`plugins/${host}/ contains ${candidates.length} plugins (${candidates.join(", ")}); pass --plugin <name>`);
  }
  return join(hostRoot, candidates[0]);
}

/**
 * Reject anything that would make the archive host-ambiguous or unclean: OS
 * junk, a foreign host's per-skill agent interface file, or a package contract
 * whose schema belongs to a different host.
 */
function assertHostSpecificPayload(rules, host, payloadRoot, members) {
  for (const member of members) {
    const name = member.split("/").pop();
    if (FORBIDDEN_MEMBERS.has(name)) fail(`remove ${member} from the payload before packaging`);
    if (FORBIDDEN_PREFIXES.some((prefix) => member.startsWith(`${prefix}/`))) {
      fail(`remove ${member} from the payload before packaging`);
    }
  }

  if (!members.includes(rules.manifestPath)) {
    fail(`payload is missing the ${host} manifest ${rules.manifestPath}`);
  }

  const interfaceFiles = members.filter((member) => /(^|\/)agents\/[^/]+\.ya?ml$/u.test(member));
  const foreign = interfaceFiles.filter((member) => basename(member) !== rules.agentInterfaceFile);
  if (foreign.length > 0) {
    fail(
      `payload carries a non-${host} skill interface file: ${foreign[0]} ` +
        `(host ${host} expects agents/${rules.agentInterfaceFile})`,
    );
  }

  const contracts = members.filter((member) => member.endsWith(rules.packageContractSuffix) && !member.includes("/"));
  if (contracts.length !== 1) {
    fail(`expected exactly one *${rules.packageContractSuffix} at the payload root, found ${contracts.length}`);
  }
  const contract = readJson(join(payloadRoot, contracts[0]));
  if (contract.schemaVersion !== rules.packageContractSchema) {
    fail(
      `${contracts[0]} declares schemaVersion "${contract.schemaVersion}" but host ${host} ` +
        `requires "${rules.packageContractSchema}"`,
    );
  }
  return { contractMember: contracts[0], contract };
}

/** The release manifest is the provenance record; a stale digest means the payload was edited without regenerating it. */
function assertReleaseManifestInSync({ payloadRoot, members, manifest, host }) {
  const releaseManifest = readJson(join(root, "release-manifest.json"));
  const declaredPath = releaseManifest.plugin?.path;
  const actualPath = relative(root, payloadRoot).split(sep).join("/");
  if (declaredPath !== actualPath) {
    fail(`release-manifest.json plugin.path is "${declaredPath}" but this run packages "${actualPath}"`);
  }
  if (releaseManifest.plugin?.version !== manifest.version) {
    fail(
      `release-manifest.json plugin.version is "${releaseManifest.plugin?.version}" but the ${host} ` +
        `manifest declares "${manifest.version}"`,
    );
  }
  const digest = contentListDigest(payloadRoot, members);
  if (releaseManifest.plugin?.contentListSha256 !== digest) {
    fail(
      "release-manifest.json plugin.contentListSha256 does not match the payload. Regenerate it with:\n" +
        `  (cd ${actualPath} && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256 | shasum -a 256)`,
    );
  }
  return { releaseManifest, contentListSha256: digest };
}

function runGates() {
  const run = (args) => execFileSync(process.execPath, args, { cwd: root, encoding: "utf8" });
  const validator = run(["scripts/validate-distribution.mjs"]).trim();
  const tests = run(["--test", "tests/distribution-contract.test.mjs"]);
  const passed = /^# pass (\d+)$/mu.exec(tests)?.[1] ?? /^ℹ pass (\d+)$/mu.exec(tests)?.[1] ?? "unknown";
  return { validator, packageTests: `${passed} passed` };
}

/**
 * Stage, normalize mtimes, then archive. `zip` reads mtimes from disk and
 * stores DOS timestamps in local time, so the staging copy is stamped to a
 * fixed instant and `zip` runs under TZ=UTC to keep the output reproducible.
 */
function buildArchive({ payloadRoot, members, outPath, epochSeconds }) {
  const staging = `${outPath}.staging`;
  rmSync(staging, { recursive: true, force: true });
  rmSync(outPath, { force: true });
  mkdirSync(staging, { recursive: true });
  cpSync(payloadRoot, staging, { recursive: true, dereference: true });

  const stamp = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) stamp(path);
      utimesSync(path, epochSeconds, epochSeconds);
    }
  };
  stamp(staging);
  utimesSync(staging, epochSeconds, epochSeconds);

  // `-X` drops platform extra fields; the explicit entry list fixes entry order.
  const entries = [...payloadDirectoryEntries(members), ...members].sort(byBytes);
  execFileSync("zip", ["-q", "-X", outPath, ...entries], {
    cwd: staging,
    env: { ...process.env, TZ: "UTC" },
  });
  rmSync(staging, { recursive: true, force: true });

  const listed = execFileSync("unzip", ["-Z1", outPath], { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .sort(byBytes);
  if (listed.join("\n") !== entries.join("\n")) {
    fail(`archive contents do not match the payload:\n  archive: ${listed.join(", ")}\n  payload: ${entries.join(", ")}`);
  }
  return {
    bytes: statSync(outPath).size,
    sha256: createHash("sha256").update(readFileSync(outPath)).digest("hex"),
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const rules = HOSTS[options.host];
  if (!rules) {
    fail(
      `host "${options.host}" has no packaging rules. Known hosts: ${Object.keys(HOSTS).join(", ")}. ` +
        "Add an entry to HOSTS in this script — its manifest path, package contract schema, and " +
        "per-skill agent interface filename — before packaging a new host.",
    );
  }

  const payloadRoot = resolvePayloadRoot(options.host, options.plugin);
  const members = payloadMembers(payloadRoot);
  const { contractMember } = assertHostSpecificPayload(rules, options.host, payloadRoot, members);
  const manifest = readJson(join(payloadRoot, rules.manifestPath));
  if (typeof manifest.name !== "string" || typeof manifest.version !== "string") {
    fail(`${rules.manifestPath} must declare string "name" and "version"`);
  }

  const { releaseManifest, contentListSha256 } = assertReleaseManifestInSync({
    payloadRoot,
    members,
    manifest,
    host: options.host,
  });

  const gates = options.skipGates ? null : runGates();

  const artifactName = (rules.artifactName ?? DEFAULT_ARTIFACT_NAME)({
    pluginName: manifest.name,
    host: options.host,
    version: manifest.version,
  });
  const outDir = resolve(root, options.outDir);
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, artifactName);

  const generatedAt = releaseManifest.generatedAt;
  const epochSeconds = Math.floor(Date.parse(generatedAt) / 1000);
  if (!Number.isFinite(epochSeconds)) {
    fail(`release-manifest.json generatedAt is not a parseable timestamp: ${generatedAt}`);
  }

  const archive = buildArchive({ payloadRoot, members, outPath, epochSeconds });

  const result = {
    host: options.host,
    hostLabel: rules.label,
    plugin: manifest.name,
    version: manifest.version,
    displayName: manifest.interface?.displayName ?? null,
    payloadRoot: relative(root, payloadRoot).split(sep).join("/"),
    hostSpecificMembers: [rules.manifestPath, contractMember, ...members.filter((m) => m.endsWith(`/agents/${rules.agentInterfaceFile}`))],
    members,
    contentListSha256,
    archive: { path: relative(root, outPath).split(sep).join("/"), ...archive },
    gates,
  };

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  console.log(`packaged ${result.plugin}@${result.version} for ${result.hostLabel}`);
  console.log(`  display name  ${result.displayName ?? "(none)"}`);
  console.log(`  payload       ${result.payloadRoot} (${members.length} files)`);
  console.log(`  host-specific ${result.hostSpecificMembers.join(", ")}`);
  console.log(`  contentList   sha256:${contentListSha256}`);
  console.log(`  archive       ${result.archive.path} (${archive.bytes} bytes)`);
  console.log(`  archive       sha256:${archive.sha256}`);
  if (gates) {
    console.log(`  validator     ${gates.validator}`);
    console.log(`  package tests ${gates.packageTests}`);
  } else {
    console.log("  gates         SKIPPED (--skip-gates)");
  }
}

try {
  main();
} catch (error) {
  console.error(`package-plugin: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
