# Open Design Cloud plugin for Codex

This package teaches Codex Desktop and Codex CLI how to create artifacts with
Open Design Cloud. The plugin does not ship an MCP server. It reuses the local
`open-design` MCP registration owned by a running Open Design app:

```text
Codex plugin
  -> local open-design MCP
  -> local Open Design daemon
  -> bundled Vela CLI
  -> remote Vela / AMR service
```

Install and run Open Design first. In Open Design, sign in to Vela once and
install the Codex MCP registration from Settings → MCP server, or run the
equivalent command exposed by the active Open Design installation:

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
unavailable, start Open Design and repair its Codex MCP registration. If Vela
reports that sign-in is required, sign in from Open Design and retry; never
paste a Vela credential into chat.

Cloud failures never switch to Local Codex or BYOK automatically.

## Local candidate install

Generate a disposable marketplace outside the repository and test it with an
isolated Codex home:

```bash
OD_CODEX_MARKETPLACE_ROOT="$(mktemp -d /tmp/open-design-codex-marketplace.XXXXXX)"
OD_CODEX_TEST_HOME="$(mktemp -d /tmp/open-design-codex-home.XXXXXX)"
pnpm tools-pack codex-cloud-plugin candidate --output "$OD_CODEX_MARKETPLACE_ROOT"
CODEX_HOME="$OD_CODEX_TEST_HOME" codex plugin marketplace add "$OD_CODEX_MARKETPLACE_ROOT" --json
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
