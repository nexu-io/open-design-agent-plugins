---
name: open-design-mode
description: Route Open Design generation requests between the default Cloud service and an explicitly selected local Open Design installation without silent fallback or secret handling.
---

# Open Design execution mode

Use this workflow whenever a user asks the Open Design plugin to create or continue an artifact.

## Choose the mode

Cloud is the default mode. Use the `open-design-cloud` tools unless the user explicitly asks to use a local Open Design installation.

Local Codex is a separate, optional mode. It runs the local `codex` CLI with
the authentication already owned by `codex login`; it does not use OpenCode
and does not accept an OpenAI API key through Open Design. Use it only when all
of the following are true:

1. The user explicitly chose Local.
2. The independently registered `open-design` MCP server is available.
3. Its tools can reach the running Open Design daemon.
4. `list_agents` reports the `codex` agent as available and authenticated.

If Local was requested but `open-design` is unavailable, explain that Open Design must be running and ask the user to install the local MCP registration from Open Design Settings or by running `od mcp install codex`. Do not change MCP configuration yourself unless the user explicitly asks you to perform that installation.

If the `codex` agent is missing, ask the user to install Codex CLI. If it is
installed but `authStatus` is `missing` or `unknown`, ask the user to run
`codex login` in their own terminal and then rescan agents. Do not ask for,
copy, or save the user's OpenAI credential.

BYOK is an optional Local mode backed by a secure daemon-owned credential
profile. Use it only when the user explicitly chose BYOK and the independently
registered `open-design` MCP server is available. The Cloud plugin and MCP
tools never receive a raw provider credential.

Never ask the user to paste an API key into chat, a command argument, an
environment example, a manifest, an MCP tool argument, or a plaintext file.
If the user has no profile, tell them to save one locally with the Open Design
Settings UI or pipe it to `od byok save ... --api-key-stdin` in their own
terminal. Do not solicit, transcribe, or repeat the key.

## Preserve execution boundaries

- Never switch modes because Cloud authentication, balance, transport, or runtime failed.
- Never treat Local as a retry of a Cloud task.
- When the user explicitly switches modes, start a new execution context and request identifier. Do not reuse Cloud billing, idempotency, project, or run identifiers in Local.
- Tell the user which mode will run and who bears the cost before starting generation: Vela/Open Design Cloud for Cloud, the user's local agent/provider for Local.
- Reuse the confirmed human-readable Brief across modes, but do not expose or repeat its signed machine confirmation envelope.

## Local Codex workflow

Use the existing `open-design` MCP tools rather than reproducing the generator:

1. Confirm the requested artifact type and readable Brief.
2. Call `list_agents` and require the exact `codex` agent to be available and
   authenticated. Do not substitute `opencode`, `byok-opencode`, Cloud, or
   another local agent.
3. Check `get_active_context` or list/create the target project.
4. Call `start_run` with `agent: "codex"` only after the user chose Local.
   Do not include `byokProfile`, `apiKey`, or provider credentials.
5. Poll `get_run` until it reaches a terminal state.
6. Return the preview or Studio link supplied by Open Design.

Tell the user that Codex/OpenAI bears the Local usage cost. If the local daemon,
Codex CLI login, or model is unavailable, report that Local diagnostic. Do not
call Cloud or Local BYOK as a fallback.

## Local BYOK workflow

BYOK is a distinct explicit mode, not a fallback for Cloud or ordinary Local:

1. Confirm the requested artifact type and readable Brief.
2. Call `list_byok_profiles` on the `open-design` MCP server.
3. If no configured profile is available, direct the user to the Settings UI
   or the stdin-only CLI setup command. Never ask for the credential.
4. Ask the user to choose a profile when more than one configured profile is
   available; the profile id and masked key tail are non-secret references.
5. Check `get_active_context` or list/create the target project.
6. Call `start_run` with only `byokProfile: "<profile-id>"`. Do not include an
   `apiKey`, provider token, or credential-shaped value in any MCP argument.
7. Poll `get_run` until it reaches a terminal state and return the supplied
   preview or Studio link.

Tell the user that their selected provider account bears BYOK usage costs. If
the secure credential backend, profile, local daemon, OpenCode runtime, or model
is unavailable, report that Local BYOK diagnostic and stop. Never retry through
Cloud or another profile automatically.
