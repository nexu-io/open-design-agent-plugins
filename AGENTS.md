# Open Design plugin distribution — agent entrypoint

This repository is designed to be operated by an agent. Codex is the only
supported host in this revision.

Canonical distribution repository:
`https://github.com/nexu-io/open-design-agent-plugins`.

## First decide the operation

Choose exactly one lane from the user's request:

1. **Install or set up** — follow "Install into Codex" below. This is the
   default when the user asks to use, install, try, or set up Open Design Cloud.
2. **Inspect or explain** — read `README.md`, the marketplace manifest, and the
   plugin manifest. Do not change Codex configuration.
3. **Uninstall** — follow `docs/INSTALL_CODEX.md#uninstall`.
4. **Refresh or release the package** — read "Maintainer lane" below. Never
   enter this lane merely because the user asked to install.
5. **Telemetry design** — read `docs/TELEMETRY.md`. Do not infer install counts
   from runtime activation.

Do not scan another repository unless the selected lane names it.

## Install into Codex

An explicit request to install or set up the plugin authorizes changes to the
user's Codex plugin configuration. It does not authorize source edits, Git
operations, OAuth login, deployment, or publication.

### 1. Preflight

Use the canonical GitHub marketplace source:

```bash
OD_AGENT_PLUGIN_SOURCE="nexu-io/open-design-agent-plugins"
codex --version
git ls-remote https://github.com/nexu-io/open-design-agent-plugins.git main
```

Require Codex CLI `0.144.6` or newer. If `codex` is missing or older, report the
exact version blocker; do not install unrelated software without authorization.
If the Git repository is unavailable or its `main` branch does not contain the
marketplace manifest, report that distribution blocker; do not substitute a
temporary or personal path.

### 2. Inspect before mutating

```bash
codex plugin marketplace list --json
codex plugin list --json
```

If `open-design-cloud@open-design` is already installed at the version declared
in `release-manifest.json`, skip reinstallation and continue to verification.
If a marketplace named `open-design` already points at a different local path
or Git source than `nexu-io/open-design-agent-plugins`, stop and report the name
collision; do not remove or overwrite the user's configured source.
Do not remove other marketplaces, plugins, or MCP servers.

### 3. Install

This is a non-default repository marketplace, so register its root explicitly:

```bash
codex plugin marketplace add "$OD_AGENT_PLUGIN_SOURCE" --ref main --json
codex plugin add open-design-cloud@open-design --json
```

If the marketplace command reports `alreadyAdded: true`, that is success.
Do not hand-edit Codex config or copy plugin files into a Codex home.

### 4. Verify

```bash
codex plugin list --json
codex mcp get open-design-cloud --json
```

Required evidence:

- plugin id `open-design-cloud@open-design`;
- installed version equals `release-manifest.json`;
- MCP is enabled;
- transport is `streamable_http`;
- URL is `https://mcp.open-design.ai/mcp`;
- no bearer token or secret is embedded.

Do not run `codex mcp login open-design-cloud` unless the user explicitly asks
to authenticate or complete a Cloud runtime smoke. Login is interactive and
depends on the real Open Design Cloud OAuth service.

### 5. Hand back

Tell the user:

- whether installation was new or already present;
- installed plugin/version and MCP URL;
- that they must start a new Codex task to load the plugin snapshot;
- that they can invoke `@open-design-cloud` and provide a design request;
- whether OAuth/runtime behavior was tested or remains an external blocker.

Never report "Cloud works" when only package installation was verified.

## Safety boundaries

- Product code, OAuth, billing, artifact generation, and telemetry services
  belong in the Open Design and Vela repositories.
- Treat `plugins/open-design-cloud/` and
  `.agents/plugins/marketplace.json` as generated distribution payloads.
- Never expose or commit API keys, OAuth tokens, Codex auth state, plugin
  caches, logs, or test artifacts.
- Cloud is remote; installation does not require starting the Open Design
  daemon, Electron app, OpenCode, or BYOK.
- A Cloud failure must not silently fall back to Local Codex or BYOK.
- Do not change Git remotes, push, publish, deploy, create a PR, or create an
  issue without explicit authorization.
- Do not label OAuth success, MCP initialization, GitHub clone/download, or
  first runtime use as an installation.

## Maintainer lane

Enter only when the user asks to refresh, validate, or release the package.

1. Read `README.md`, `release-manifest.json`, and
   `docs/INSTALL_CODEX.md#unpublished-candidate-smoke`.
2. Validate the source package in the Open Design repository.
3. Generate a candidate into a new empty directory outside that repository.
4. Compare it with this repository's generated payload.
5. Replace only reviewed generated files and refresh provenance.
6. Run the plugin validator and isolated Codex add/install/remove smoke.
7. Keep changes unpushed unless the user separately authorizes publication.

The current `release-manifest.json` marks the source as
`dirty-local-candidate`; it is suitable for local testing, not public release.
