# Open Design plugin distribution — agent entrypoint

This repository is designed to be operated by an agent. Codex is the only
supported host in this revision.

Canonical distribution repository:
`https://github.com/nexu-io/open-design-agent-plugins`.

## First decide the operation

Choose exactly one lane:

1. **Install or set up** — follow "Install into Codex" below.
2. **Inspect or explain** — read `README.md`, `release-manifest.json`, the
   marketplace manifest, and the plugin manifest. Do not change configuration.
3. **Uninstall** — follow `docs/INSTALL_CODEX.md#uninstall`.
4. **Refresh or release** — follow "Maintainer lane" below.
5. **Telemetry design** — read `docs/TELEMETRY.md`.

Do not scan the Open Design product repository unless the selected lane
explicitly requires source refresh or source validation.

## Architecture to preserve

The plugin does not bundle or deploy an MCP server:

```text
Codex plugin
  -> local open-design MCP
  -> running local Open Design
  -> bundled Vela CLI
  -> remote Vela / AMR service
```

Open Design must be installed. Its Electron GUI need not be open: the registered
local MCP starts the signed packaged runtime headlessly when needed. Vela
browser login is initiated through narrow Open Design MCP tools; Codex never
receives a Vela token. Cloud generation always calls the local MCP with
`agent: "amr"`. Local Codex and BYOK share that MCP but remain explicit modes,
never fallbacks.

## Install into Codex

An explicit request to install or set up authorizes changes to the user's Codex
plugin and MCP configuration. It does not authorize source edits, Git pushes,
Vela login, deployment, publication, or deleting unrelated configuration.

### 1. Preflight

```bash
OD_AGENT_PLUGIN_SOURCE="nexu-io/open-design-agent-plugins"
codex --version
git ls-remote https://github.com/nexu-io/open-design-agent-plugins.git main
```

Require Codex CLI `0.144.6` or newer. Also require a compatible Open Design
installation at version `0.17.0` or newer. That release boundary contains the
telemetry-v3 Plugin workflow contract, local MCP brief card, and bundled Vela
CLI. If Open Design is absent or older, ask for confirmation before opening
the official `https://open-design.ai/download/` page. The user completes the
operating system's signed-app installation. Do not substitute a remote MCP
URL, silently download an installer, or execute an unverified install script.

### 2. Inspect before mutating

```bash
codex plugin marketplace list --json
codex plugin list --json
codex mcp get open-design --json
```

The last command may report that the MCP is not installed. If
`open-design-cloud@open-design` is already at the version declared in
`release-manifest.json`, do not reinstall it. If marketplace `open-design`
points at a different source, stop and report the name collision. Never remove
or overwrite unrelated marketplaces, plugins, MCP servers, or auth state.

### 3. Install the plugin

```bash
codex plugin marketplace add "$OD_AGENT_PLUGIN_SOURCE" --ref main --json
codex plugin add open-design-cloud@open-design --json
```

`alreadyAdded: true` is success. Do not hand-edit Codex configuration or copy
plugin files into a Codex home.

### 4. Ensure the local MCP registration

If `codex mcp get open-design --json` already succeeds, preserve it. Otherwise,
resolve the installed signed Open Design application and use its packaged
`--headless --mcp-install codex` operation. The Settings → MCP server action or
the `od mcp install codex` command supplied by an active installation are
equivalent supported paths. The resulting registration discovers the daemon
and restarts it headlessly when stopped. Do not guess a localhost port,
hard-code a source checkout path, or invoke the unrelated macOS `/usr/bin/od`.

Do not run `codex mcp login`: Vela login belongs in Open Design, not Codex MCP.
Do not perform the interactive Vela login unless the user separately asks.

### 5. Verify

```bash
codex plugin list --json
codex mcp get open-design --json
```

Required evidence:

- plugin id `open-design-cloud@open-design`;
- installed version equals `release-manifest.json`;
- Open Design satisfies the package's `minimumOpenDesignVersion`;
- MCP name is `open-design` and is enabled;
- transport is stdio with an absolute Open Design launch command;
- no bearer token, API key, or Vela credential is embedded.

If Open Design is running, a runtime smoke may additionally verify that
`collect_brief` exposes the versioned MCP Apps resource and `list_agents`
contains `amr`. An unauthenticated `start_run(..., agent: "amr")` must stop at
the Vela sign-in boundary, not fall back to another runtime.

### 6. Hand back

Report:

- whether installation was new or already present;
- installed plugin id and version;
- local MCP identity and whether its runtime was reached;
- that Vela login is completed from Open Design;
- that a new Codex task is needed to load the plugin snapshot;
- whether artifact generation was tested or remains pending login/quota;
- that one confirmed generation uses one stable request id and that retries
  never silently change mode.
- that the first observed Plugin tool establishes one server-issued workflow
  id which is preserved through terminal delivery.

Never report "Cloud works" when only package installation was verified.

## Safety boundaries

- Product code, Vela auth/billing, artifact generation, and runtime telemetry
  belong in the Open Design and Vela repositories.
- Treat `plugins/codex/open-design-cloud/` and
  `.agents/plugins/marketplace.json` as generated distribution payloads.
- Never expose or commit credentials, Codex auth state, plugin caches, logs, or
  smoke-test artifacts.
- There is no remote MCP dependency or fallback.
- Do not change Git remotes, push, publish, create a PR, or create an issue
  without explicit authorization.

## Maintainer lane

Enter only when the user asks to refresh, validate, or release:

1. Read `README.md`, `release-manifest.json`, and
   `docs/INSTALL_CODEX.md#unpublished-candidate-smoke`.
2. Validate the source package at a specific Open Design commit.
3. Generate a candidate into a new empty directory outside that repository.
4. Replace only reviewed generated payload files and update provenance.
   Recompute the payload digest from its root with:
   `find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256 | shasum -a 256`.
5. Run the plugin validator, package tests, isolated Codex install, local MCP
   brief-card smoke, and AMR auth-boundary smoke.
6. Clean exact temporary roots and projects.
7. Keep changes unpushed unless publication was explicitly authorized.

## Host directory convention

Portable payloads live at `plugins/<host>/<plugin-name>/`. The supported Codex
payload is `plugins/codex/open-design-cloud/`. Add Claude or Gemini directories
only when a validated host-specific package exists.
