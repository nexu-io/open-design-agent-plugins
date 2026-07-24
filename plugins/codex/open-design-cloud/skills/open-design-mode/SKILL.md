---
name: open-design-mode
description: Create Open Design artifacts through the local Open Design MCP, using remote Vela/AMR by default and Local Codex or BYOK only when explicitly selected.
---

# Open Design execution mode

Use this workflow whenever a user asks the Open Design Cloud plugin to create
or continue an artifact.

## Required local boundary

All modes use the independently registered local `open-design` MCP server. The
plugin does not include an MCP transport and does not call a remote MCP domain.

If `open-design` is unavailable, explain that Open Design must be installed and
running. Ask the user to install or repair the Codex MCP registration from Open
Design Settings → MCP server or by running `od mcp install codex`. Do not invent
a localhost URL or run the macOS `/usr/bin/od` utility.

## Choose the mode

Cloud is the default mode. It uses the local Open Design daemon and bundled
Vela CLI to reach the remote Vela/AMR service. Local Codex and BYOK are
available only when the user explicitly selects them.

Never switch modes because authentication, balance, transport, or generation
failed. When the user explicitly switches modes, start a new execution context
and request identifier. Reuse only the human-readable confirmed brief; never
repeat its signed machine envelope.

## Cloud workflow

1. Call `collect_brief` on the `open-design` MCP server with the requested
   artifact type and a concise project title.
2. Let the user complete the rendered Open Design brief card. Use the readable
   confirmed summary returned by the card; do not display or ask the user to
   paste a signed confirmation token.
3. Call `list_agents` and require the exact `amr` agent.
4. Check `get_active_context` or list/create the target project.
5. Call `start_run` with `agent: "amr"`. Do not substitute `codex`,
   `opencode`, `byok-opencode`, or another runtime.
6. Poll `get_run` until it reaches a terminal state and return the supplied
   preview or Studio link.

If Vela reports that sign-in is required, ask the user to sign in once from the
running Open Design app and retry. Never request, copy, or store a Vela token in
chat or plugin files. Tell the user that Vela/Open Design Cloud bears the Cloud
usage cost.

## Local Codex workflow

Use this only when the user explicitly chose Local Codex:

1. Confirm the requested artifact type and readable brief.
2. Call `list_agents` and require the exact `codex` agent to be available and
   authenticated.
3. Check `get_active_context` or list/create the target project.
4. Call `start_run` with `agent: "codex"` and no BYOK profile or credential.
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
6. Call `start_run` with only `byokProfile: "<profile-id>"`.
7. Poll `get_run` and return the preview or Studio link.

Never ask for or include a raw API key, provider token, or credential-shaped
value in chat, an MCP argument, a manifest, an environment example, or a
plaintext file. Tell the user that their selected provider account bears BYOK
usage costs.
