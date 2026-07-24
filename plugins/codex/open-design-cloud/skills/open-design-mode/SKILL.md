---
name: open-design-mode
description: Create Open Design artifacts through the local Open Design MCP, using Vela Cloud by default and Local Codex or secure BYOK only when explicitly selected.
---

# Open Design execution mode

Use this workflow whenever a user asks the Open Design Cloud plugin to create
or continue an artifact.

## Required local boundary

All modes use the independently registered local `open-design` MCP server. The
plugin does not include an MCP transport and does not call a remote MCP domain.

Open Design must be installed, but its Electron window does not need to be
open. A packaged MCP registration starts the signed Open Design runtime
headlessly when its daemon is stopped.

If `open-design` is unavailable:

1. Check whether Open Design is installed and whether an `open-design` MCP
   registration already exists. Preserve all unrelated MCP servers.
2. If Open Design is missing, ask the user before opening the official download
   page at `https://open-design.ai/download/`. Do not silently download or
   execute an installer, and do not use an unverified install script.
3. If Open Design is installed, use its resolved signed packaged executable
   with `--headless --mcp-install codex`, or use the `od mcp install codex`
   operation supplied by that installation. Do not guess a source checkout
   path, a localhost URL, or run the unrelated macOS `/usr/bin/od` utility.
4. Verify `codex mcp get open-design --json`. If the current Codex task cannot
   hot-load the new MCP snapshot, tell the user to start one new task.

## Choose the mode

Cloud is the default mode. It uses the local Open Design daemon and bundled
Vela CLI to reach the remote Vela/AMR service. Local Codex and BYOK are
available only when the user explicitly selects them.

Never switch modes because authentication, balance, transport, quota, or
generation failed. When the user explicitly switches modes, start a new
execution context and request identifier. Reuse only the human-readable
confirmed brief; never repeat its signed machine envelope.

## One confirmed action, one request

After the brief and execution mode are confirmed, create one opaque stable
`requestId` for that logical generation. Keep the exact `start_run` arguments
and reuse both the arguments and `requestId` if the MCP response is lost or a
transport retry is required.

- Call `start_run` once for the confirmed action.
- Use only `get_run` to poll. Polling must never call `start_run` again.
- A changed prompt, project, confirmed mode, agent, or BYOK profile is a new
  logical generation and receives a new `requestId`.
- Never reuse a `requestId` with different arguments.
- Never display a request id as user-facing content.

## Cloud workflow

1. Call `collect_brief` on the `open-design` MCP server with the requested
   artifact type and a concise project title.
2. Let the user complete the rendered Open Design brief card. Use the readable
   confirmed summary returned by the card; do not display or ask the user to
   paste a signed confirmation token.
3. Call `get_vela_login_status`. If signed out, call `start_vela_login`, show
   the returned activation URL and user code, then poll
   `get_vela_login_status`. The Open Design GUI is not required.
4. Call `list_agents` and require the exact `amr` agent.
5. Check `get_active_context` or list/create the target project.
6. Create one `requestId`, then call `start_run` with that `requestId` and
   `agent: "amr"`. Do not substitute `codex`, `opencode`, `byok-opencode`, or
   another runtime.
7. Poll `get_run` until it reaches a terminal state and return the supplied
   preview or Studio link.

Never request, copy, or store a Vela token in chat or plugin files. Tell the
user that Vela/Open Design Cloud bears the Cloud usage cost.

If `get_run` reports insufficient balance:

1. Preserve the confirmed brief, project, run id, original `requestId`, and
   original `start_run` arguments.
2. Show the returned recharge URL and wait for the user to say that top-up is
   complete. Do not loop automatically.
3. After that explicit confirmation, call `start_run` with the exact original
   arguments and `requestId`, plus `resume: true`.
4. Continue polling the same logical run with `get_run`.

Do not create another project or logical run, and do not infer whether Vela
charged the account. Vela owns the remote operation, wallet, and billing truth.

## Local Codex workflow

Use this only when the user explicitly chose Local Codex:

1. Confirm the requested artifact type and readable brief.
2. Call `list_agents` and require the exact `codex` agent to be available and
   authenticated.
3. Check `get_active_context` or list/create the target project.
4. Create one `requestId`, then call `start_run` with that `requestId`,
   `agent: "codex"`, and no BYOK profile or credential.
5. Poll `get_run` and return the preview or Studio link.

If Codex CLI is missing, ask the user to install it. If its authentication is
missing or unknown, ask the user to run `codex login` and rescan agents. Local
Codex does not use OpenCode and Open Design must never receive an OpenAI key.

## Local BYOK workflow

BYOK is a separate explicit mode, not a fallback:

1. Confirm the requested artifact type and readable brief.
2. Call `list_byok_profiles`.
3. If no profile exists, direct the user to Open Design Settings or the
   stdin-only `od byok save --api-key-stdin` command.
4. If multiple profiles exist, ask the user to choose by non-secret profile id.
5. Check `get_active_context` or list/create the target project.
6. Create one `requestId`, then call `start_run` with that `requestId` and only
   the non-secret `byokProfile: "<profile-id>"` runtime selector.
7. Poll `get_run` and return the preview or Studio link.

Never ask for or include a raw API key, provider token, or credential-shaped
value in chat, an MCP argument, a manifest, an environment example, or a
plaintext file. Tell the user that their selected provider account bears BYOK
usage costs.
