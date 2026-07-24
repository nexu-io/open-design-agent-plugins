# Open Design Cloud plugin for Codex

This package teaches Codex Desktop and Codex CLI how to create artifacts with
Open Design Cloud. The plugin does not ship an MCP server. It reuses the local
`open-design` MCP registration owned by an installed Open Design runtime:

```text
Codex plugin
  -> local open-design MCP
  -> local Open Design daemon
  -> bundled Vela CLI
  -> remote Vela / AMR service
```

Install Open Design first. Its GUI does not need to remain open: the packaged
MCP registration starts the signed runtime headlessly whenever its daemon is
stopped. Install the registration from Settings → MCP server, with the packaged
`--headless --mcp-install codex` operation, or with the equivalent command
exposed by the active Open Design installation:

```bash
od mcp install codex
```

The command discovers the active daemon through `/api/mcp/install-info` and
registers an absolute launch command. The plugin deliberately has no
`.mcp.json`: hard-coding `od` would collide with the unrelated macOS
`/usr/bin/od`, while a fixed localhost URL would not survive packaged sidecar
or namespace changes.

## Cloud workflow

Cloud is the default mode. The local MCP provides `collect_brief` and its MCP
Apps selection card, then Open Design starts generation with `agent: "amr"`.
Vela owns remote authentication, quota, and generation. If the local MCP is
unavailable, repair its Codex registration from the installed runtime. If Vela
reports that sign-in is required, the plugin calls `start_vela_login` and
`get_vela_login_status` to complete browser authorization without requiring the
Open Design GUI; never paste a Vela credential into chat.

One confirmed action receives one stable `requestId`. Transport retries reuse
the exact request, and `get_run` only polls. If Vela reports insufficient
balance, the plugin preserves the original run, shows the recharge URL, waits
for explicit user confirmation, and resumes with the same request plus
`resume: true`.

Cloud failures never switch to Local Codex or BYOK automatically.

## Local candidate install

Test the repository itself with an isolated Codex home:

```bash
OD_CODEX_TEST_HOME="$(mktemp -d /tmp/open-design-codex-home.XXXXXX)"
OD_AGENT_PLUGIN_REPO="$(git rev-parse --show-toplevel)"
CODEX_HOME="$OD_CODEX_TEST_HOME" codex plugin marketplace add "$OD_AGENT_PLUGIN_REPO" --json
CODEX_HOME="$OD_CODEX_TEST_HOME" codex plugin add open-design-cloud@open-design --json
CODEX_HOME="$OD_CODEX_TEST_HOME" codex plugin list --json
```

The plugin install and MCP registration are intentionally independent. For a
complete smoke, start an isolated Open Design runtime and run its resolved
`od mcp install codex` command with the same isolated `CODEX_HOME`, then verify:

```bash
CODEX_HOME="$OD_CODEX_TEST_HOME" codex mcp get open-design --json
```

Delete only the exact temporary roots created for the smoke after testing.

## Explicit optional modes

Local Codex shares the same `open-design` MCP server but runs Open Design with
the local `codex` agent and the login already owned by `codex login`. It never
passes an OpenAI key through Open Design:

```bash
codex login
od mcp install codex
```

When Local Codex is explicitly selected, require `list_agents` to report the
exact `codex` runtime and call `start_run(..., agent: "codex")`.

BYOK is a separate explicit mode backed by Open Design's secure credential
profiles and OpenCode runtime. Save credentials only in Open Design Settings or
through the stdin-only `od byok save --api-key-stdin` command. MCP calls receive
only the non-secret profile id.

## Package contract

- `.codex-plugin/plugin.json` is the only Codex plugin manifest.
- There is no bundled `.mcp.json` and no remote MCP domain.
- `open-design-cloud.package.json` pins the local MCP registration contract,
  canonical Vela endpoints, `agent: "amr"`, and the versioned MCP Apps resource.
- `skills/open-design-mode/SKILL.md` keeps Cloud, Local Codex, and BYOK routing
  explicit and prevents silent fallback.
- Update both package versions, run the validator, and run an isolated Codex
  installation smoke for each release.
