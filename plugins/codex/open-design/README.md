# Open Design plugin for Codex

This package teaches Codex Desktop and Codex CLI how to create artifacts with
Open Design. Open Design Cloud remains the default execution mode. The plugin
does not ship an MCP server. It reuses the local
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
CODEX_HOME="$OD_CODEX_TEST_HOME" codex plugin add open-design@open-design --json
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
exact `codex` runtime. Resolve any explicitly selected current-task model,
reasoning effort, and service tier from host task metadata or, when necessary,
the task-bound latest authoritative `turn_context`. Pass explicit values as
`model`, `reasoning`, and the separate `serviceTier` to one
`start_run(..., agent: "codex")`. An explicit incompatible setting stops before
generation. An unspecified setting is omitted, uses the child CLI default, and
leaves execution parity unconfirmed. The Local Codex route never switches
modes.

Where the host boundary could release the packaged runtime between nested tool
calls, one long-lived code-mode orchestration owns the single `start_run` and
every `get_run` poll through terminal delivery. The run prompt also carries a
bounded child-runtime instruction that prevents the child Codex from invoking
the Open Design Plugin or local MCP recursively.

Ordinary polling never retries `start_run`. If its initial response is lost
before a run id is observed, retry once with the byte-identical workflow,
request, project, prompt, agent, model, reasoning, and optional service-tier
arguments so the runtime returns the same logical run rather than creating a
duplicate.

On Codex Desktop, the first current-run `studioUrl` returned while generation
is running opens immediately in the host-provided in-app Browser when that
capability is callable. If no Studio URL was available earlier, successful
terminal delivery opens `studioUrl` or falls back to `previewUrl`. Each run
opens at most one tab. Codex CLI and hosts without that capability receive the
same clickable link without treating the missing open action as generation
failure.

BYOK is a separate explicit mode backed by Open Design's secure credential
profiles and OpenCode runtime. Save credentials only in Open Design Settings or
through the stdin-only `od byok save --api-key-stdin` command. MCP calls receive
only the non-secret profile id.

## Package contract

- `.codex-plugin/plugin.json` is the only Codex plugin manifest.
- There is no bundled `.mcp.json` and no remote MCP domain.
- `open-design.package.json` pins the local MCP registration contract,
  Open Design `0.17.0` minimum for the existing product modes, telemetry
  schema v3, mode-aware tools, the Local Codex exact-setting arguments,
  canonical Vela endpoints, `agent: "amr"`, and the versioned MCP Apps
  resource.
- `skills/open-design-mode/SKILL.md` keeps Cloud, Local Codex, and BYOK routing
  explicit, establishes one bounded self-reported Plugin workflow, keeps the
  generation request stable, and prevents silent fallback.
- Terminal `get_run` is the default delivery. `get_artifact` is an optional
  bounded context read and carries the same server-issued workflow id.
- Update both package versions, run the validator, and run an isolated Codex
  installation smoke for each release.
