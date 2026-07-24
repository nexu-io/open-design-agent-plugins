# Install in Codex

## Supported environment

- Codex Desktop or Codex CLI `0.144.6` or newer
- A compatible Open Design installation with bundled Vela CLI
- Plugin selector `open-design-cloud@open-design`
- Local MCP identity `open-design`

## Normal Git marketplace install

```bash
codex plugin marketplace add nexu-io/open-design-agent-plugins --ref main --json
codex plugin add open-design-cloud@open-design --json
```

Start Open Design. Register its local MCP from Settings → MCP server, or use the
`od mcp install codex` command supplied by the active installation. This command
discovers `/api/mcp/install-info`; do not hard-code a port or source path.

```bash
codex plugin list --json
codex mcp get open-design --json
```

Expected MCP identity:

- Name: `open-design`
- Transport: stdio
- Command: absolute Open Design Node/CLI launch command
- Authentication: Vela login remains in Open Design

The plugin has no `.mcp.json` and no remote MCP endpoint. Start a new Codex task
after installation so it loads the new plugin snapshot.

## Published Git marketplace smoke

An isolated `CODEX_HOME` can verify package installation without touching normal
Codex state:

```bash
OD_CODEX_PLUGIN_TEST_HOME="$(mktemp -d /tmp/open-design-plugin-codex-home.XXXXXX)"
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin marketplace add \
  nexu-io/open-design-agent-plugins --ref main --json
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin add \
  open-design-cloud@open-design --json
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin list --json
```

Plugin installation alone does not create the independent local MCP. For a full
smoke, start an isolated Open Design runtime and run its resolved
`od mcp install codex` operation with the same isolated `CODEX_HOME`, then:

```bash
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex mcp get open-design --json
```

Verify the local MCP exposes `collect_brief`, the versioned MCP Apps HTML
resource, and `amr`; then verify an unauthenticated
`start_run(..., agent: "amr")` stops at the Vela sign-in boundary. Remove the
smoke project and stop the isolated runtime.

Delete only the exact temporary roots created by the smoke.

## Unpublished candidate smoke

Maintainers may substitute the current repository root for the Git source:

```bash
OD_AGENT_PLUGIN_REPO="$(git rev-parse --show-toplevel)"
OD_CODEX_PLUGIN_TEST_HOME="$(mktemp -d /tmp/open-design-plugin-candidate-home.XXXXXX)"
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin marketplace add \
  "$OD_AGENT_PLUGIN_REPO" --json
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin add \
  open-design-cloud@open-design --json
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin list --json
```

This local source is test evidence only, never the normal user installation
route.

## Agent completion report

Report all of:

- whether the marketplace/plugin was newly installed or already present;
- installed plugin id and version;
- whether local `open-design` MCP registration exists and was reachable;
- whether brief-card and AMR runtime checks were completed;
- whether Vela login or quota remains;
- the new-task requirement.

## Authentication boundary

Do not run `codex mcp login`. Vela sign-in is completed through Open Design and
is stored by the local Vela CLI integration. Codex uses that login state only
through the local MCP.

## Uninstall

```bash
codex plugin remove open-design-cloud@open-design --json
codex plugin marketplace remove open-design --json
```

Removing the plugin does not remove the independently registered `open-design`
MCP or Open Design application data. Remove those only on a separate explicit
request.
