# Install in Codex

## Supported environment

- Codex Desktop or Codex CLI `0.144.6` or newer
- Open Design `0.17.0` or newer with bundled Vela CLI; its GUI does not need to
  be open
- Plugin selector `open-design@open-design`
- Local MCP identity `open-design`

## Normal Git marketplace install

```bash
codex plugin marketplace add nexu-io/open-design-agent-plugins --ref main --json
codex plugin add open-design@open-design --json
```

If Open Design is not installed, ask before opening the official
`https://open-design.ai/download/` page. The user completes the operating
system's signed-app installation. Do not silently download or execute an
installer.

Register the local MCP from Settings → MCP server, use the installed signed
application's `--headless --mcp-install codex` operation, or use the
`od mcp install codex` command supplied by an active installation. The
registration starts the packaged runtime headlessly when its daemon is stopped;
do not hard-code a port or source path.

```bash
codex plugin list --json
codex mcp get open-design --json
```

Expected MCP identity:

- Name: `open-design`
- Transport: stdio
- Command: absolute Open Design Node/CLI launch command
- Authentication: Vela login remains in Open Design and is initiated through
  `start_vela_login` when required

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
  open-design@open-design --json
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin list --json
```

Plugin installation alone does not create the independent local MCP. For a full
smoke, start an isolated Open Design runtime and run its resolved
`od mcp install codex` operation with the same isolated `CODEX_HOME`, then:

```bash
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex mcp get open-design --json
```

Verify the local MCP exposes the package's mode-aware capability contract:
core Brief/project/run tools; Cloud login and `list_agents`; Local Codex
`list_agents`; BYOK `list_byok_profiles`; and optional `get_artifact`. Verify
the versioned MCP Apps HTML resource and exact `amr` runtime. The first
observed Plugin call must accept the bounded context and return one
`pluginWorkflowId`; later tools preserve that id. A repeated `start_run` with
identical arguments and `requestId` must resolve to the same logical run. An
unauthenticated Cloud request must stop at the Vela sign-in boundary, not
switch modes. Remove the smoke project and stop the isolated runtime.

Delete only the exact temporary roots created by the smoke.

## Unpublished candidate smoke

Maintainers may substitute the current repository root for the Git source:

```bash
OD_AGENT_PLUGIN_REPO="$(git rev-parse --show-toplevel)"
OD_CODEX_PLUGIN_TEST_HOME="$(mktemp -d /tmp/open-design-plugin-candidate-home.XXXXXX)"
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin marketplace add \
  "$OD_AGENT_PLUGIN_REPO" --json
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin add \
  open-design@open-design --json
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

Do not run `codex mcp login`. Vela sign-in is initiated through Open Design's
`start_vela_login` MCP tool and stored by the local Vela CLI integration. Codex
uses that login state only through the local MCP; opening the Open Design GUI is
not required.

## Run and billing recovery contract

For each confirmed brief and explicitly chosen mode, generate one stable
`requestId`. Call `start_run` once and use only `get_run` for polling. A lost
response is retried with identical arguments and the same `requestId`.

When Vela reports insufficient balance, keep the original project, brief,
request id, and run. Show the supplied recharge URL and wait for the user to
confirm top-up. Then send the identical request with `resume: true`. Never
create a second logical run, infer billing locally, or fall back to Local Codex
or BYOK.

## Uninstall

```bash
codex plugin remove open-design@open-design --json
codex plugin marketplace remove open-design --json
```

Removing the plugin does not remove the independently registered `open-design`
MCP or Open Design application data. Remove those only on a separate explicit
request.
