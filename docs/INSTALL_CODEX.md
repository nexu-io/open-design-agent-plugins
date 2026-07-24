# Install in Codex

## Supported environment

- Codex Desktop or Codex CLI
- Codex CLI `0.144.6` or newer
- Current package selector: `open-design-cloud@open-design`

## Normal Git marketplace install

Register the canonical Git marketplace, then install the plugin:

```bash
codex plugin marketplace add nexu-io/open-design-agent-plugins --ref main --json
codex plugin add open-design-cloud@open-design --json
```

Verify the package and its MCP registration:

```bash
codex plugin list --json
codex mcp get open-design-cloud --json
```

Expected MCP identity:

- Name: `open-design-cloud`
- Transport: Streamable HTTP
- URL: `https://mcp.open-design.ai/mcp`
- Authentication: OAuth on first protected use

Start a new Codex task after installation. The current task may keep the plugin
snapshot it loaded at startup.

## Published Git marketplace smoke

Use an empty temporary `CODEX_HOME` so normal Codex configuration, OAuth state,
and plugins are untouched:

```bash
OD_CODEX_PLUGIN_TEST_HOME="$(mktemp -d /tmp/open-design-plugin-codex-home.XXXXXX)"
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin marketplace add \
  nexu-io/open-design-agent-plugins --ref main --json
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin add \
  open-design-cloud@open-design --json
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin list --json
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex mcp get \
  open-design-cloud --json
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin remove \
  open-design-cloud@open-design --json
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin marketplace remove \
  open-design --json
```

Delete only the exact temporary directory printed or assigned above after
checking its path. Do not point cleanup at a normal Codex home.

## Unpublished candidate smoke

Maintainers may validate working-tree changes before publication by substituting
the current repository root for the Git source:

```bash
OD_AGENT_PLUGIN_REPO="$(git rev-parse --show-toplevel)"
OD_CODEX_PLUGIN_TEST_HOME="$(mktemp -d /tmp/open-design-plugin-candidate-home.XXXXXX)"
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin marketplace add \
  "$OD_AGENT_PLUGIN_REPO" --json
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin add \
  open-design-cloud@open-design --json
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin list --json
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex mcp get \
  open-design-cloud --json
```

This local-source path is test evidence only. Never present it to users as the
normal installation route.

## Agent completion report

An installation agent should report all of:

- whether the marketplace/plugin was newly installed or already present;
- the installed plugin id and version;
- the MCP transport and URL;
- whether OAuth/runtime testing was requested and completed;
- the new-task requirement.

Package installation alone is not evidence that OAuth or Cloud generation is
healthy.

## Authentication boundary

`codex mcp login open-design-cloud` is not an installation test. It depends on
the real Open Design Cloud OAuth discovery, authorization, and redirect
endpoints. Record external endpoint failures separately; do not change the
package or silently fall back to Local Codex/BYOK.

## Uninstall

```bash
codex plugin remove open-design-cloud@open-design --json
codex plugin marketplace remove open-design --json
```

Removing the Cloud plugin must not remove the separately registered local
`open-design` MCP server or any Open Design application data.
