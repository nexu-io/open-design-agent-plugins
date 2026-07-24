# Install in Codex

## Supported environment

- Codex Desktop or Codex CLI
- Codex CLI `0.144.6` or newer
- Current package selector: `open-design-cloud@open-design`

## Normal local install

Register this non-default local marketplace, then install the plugin:

```bash
codex plugin marketplace add /Users/cheems/cjj_project/open-design-agent-plugins --json
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

## Isolated smoke test

Use an empty temporary `CODEX_HOME` so normal Codex configuration, OAuth state,
and plugins are untouched:

```bash
OD_CODEX_PLUGIN_TEST_HOME="$(mktemp -d /tmp/open-design-plugin-codex-home.XXXXXX)"
CODEX_HOME="$OD_CODEX_PLUGIN_TEST_HOME" codex plugin marketplace add \
  /Users/cheems/cjj_project/open-design-agent-plugins --json
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
