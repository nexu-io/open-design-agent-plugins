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

## Start one attributed workflow

This first-party Git marketplace package uses this exact bounded
`externalPluginContext`:

```text
externalPluginContext = {
  id: "open-design-cloud",
  version: "0.4.0",
  distributionMechanism: "git_marketplace",
  publisherClass: "open_design_first_party"
}
```

Do not add host names, paths, branch names, prompts, brief answers, account
data, or credentials.

1. Send `externalPluginContext` with `collect_brief`. If the user explicitly
   skips the interactive questions, still call `collect_brief` once with
   `skip: true` and the same Context so the local MCP can establish attribution
   before login, project, or run work begins.
2. Preserve the server-issued `pluginWorkflowId`. The rendered Brief card
   inherits the workflow through its draft; use the same `pluginWorkflowId`
   returned after confirmation.
3. Pass that exact `pluginWorkflowId` to every later login, agent discovery,
   project, run, polling, and optional artifact-context tool call.
4. Never invent an id, replace it after a retry, infer it from a project or
   latest run, or attach it to an unrelated direct MCP call.

If the MCP rejects these fields or does not return a workflow id, stop and
report that this plugin requires Open Design 0.17.0 or newer. Do not remove the
context, silently lose attribution, use a remote MCP, or change execution mode.

## One confirmed action, one request

After the brief and execution mode are confirmed, create one opaque stable
`requestId` for that logical generation. Keep the exact `start_run` arguments
and reuse both the arguments and `requestId` if the MCP response is lost or a
transport retry is required.

- Call `start_run` once for the confirmed action.
- Use only `get_run` to poll. Polling must never call `start_run` again.
- Keep the same `requestId` and `pluginWorkflowId` for retries and recharge
  resume. The workflow id attributes the whole Plugin journey; the request id
  deduplicates one confirmed generation.
- A changed prompt, project, confirmed mode, agent, or BYOK profile is a new
  logical generation and receives a new `requestId`.
- Never reuse a `requestId` with different arguments.
- Never display a request id as user-facing content.

## Cloud workflow

1. Start the attributed workflow above by calling `collect_brief` on the
   `open-design` MCP server with the requested artifact type and a concise
   project title.
2. Let the user complete the rendered Open Design brief card. Use the readable
   confirmed summary returned by the card; do not display or ask the user to
   paste a signed confirmation token.
3. Call `get_vela_login_status` with the workflow id. If signed out, call
   `start_vela_login` with the same id, show the returned activation URL and
   user code, then poll `get_vela_login_status` with the same id. The Open
   Design GUI is not required.
4. Call `list_agents` with the workflow id and require the exact `amr` agent.
5. Check `get_active_context` or list/create the target project, always carrying
   the workflow id.
6. Create one `requestId`, then call `start_run` with that `requestId` and
   `pluginWorkflowId`, plus `agent: "amr"`. Do not substitute `codex`,
   `opencode`, `byok-opencode`, or another runtime.
7. Poll `get_run` with the same `pluginWorkflowId` until it reaches a terminal
   state and return the supplied preview or Studio link.

Never request, copy, or store a Vela token in chat or plugin files. Tell the
user that Vela/Open Design Cloud bears the Cloud usage cost.

If `get_run` reports insufficient balance:

1. Preserve the confirmed brief, project, run id, original `requestId`, and
   original `start_run` arguments.
2. Show the returned recharge URL and wait for the user to say that top-up is
   complete. Do not loop automatically.
3. After that explicit confirmation, call `start_run` with the exact original
   arguments, `requestId`, and `pluginWorkflowId`, plus `resume: true`.
4. Continue polling the same logical run with `get_run` and the same workflow
   id.

Do not create another project or logical run, and do not infer whether Vela
charged the account. Vela owns the remote operation, wallet, and billing truth.

## Local Codex workflow

Use this only when the user explicitly chose Local Codex:

1. Start the attributed workflow above and confirm the requested artifact type
   and readable brief.
2. Call `list_agents` and require the exact `codex` agent to be available and
   authenticated, carrying the workflow id.
3. Check `get_active_context` or list/create the target project with the same
   workflow id.
4. Create one `requestId`, then call `start_run` with that `requestId`,
   `pluginWorkflowId`, `agent: "codex"`, and no BYOK profile or credential.
5. Poll `get_run` with the same workflow id and return the preview or Studio
   link.

If Codex CLI is missing, ask the user to install it. If its authentication is
missing or unknown, ask the user to run `codex login` and rescan agents. Local
Codex does not use OpenCode and Open Design must never receive an OpenAI key.

## Local BYOK workflow

BYOK is a separate explicit mode, not a fallback:

1. Start the attributed workflow above and confirm the requested artifact type
   and readable brief.
2. Call `list_byok_profiles` with the workflow id.
3. If no profile exists, direct the user to Open Design Settings or the
   stdin-only `od byok save --api-key-stdin` command.
4. If multiple profiles exist, ask the user to choose by non-secret profile id.
5. Check `get_active_context` or list/create the target project with the same
   workflow id.
6. Create one `requestId`, then call `start_run` with that `requestId`,
   `pluginWorkflowId`, and only the non-secret
   `byokProfile: "<profile-id>"` runtime selector.
7. Poll `get_run` with the same workflow id and return the preview or Studio
   link.

Never ask for or include a raw API key, provider token, or credential-shaped
value in chat, an MCP argument, a manifest, an environment example, or a
plaintext file. Tell the user that their selected provider account bears BYOK
usage costs.

## Optional artifact context

Terminal `get_run` is the default delivery path. Return its canonical Preview
or Studio reference without forcing a source download.

Only when the agent genuinely needs source context and `get_artifact` is
advertised:

1. Pass the same `pluginWorkflowId` to `get_artifact`; this optional call must
   use the exact project returned by the linked run.
2. Select an entry and bounded include/byte options appropriate to the task.
   Treat `truncated: true` as partial context, not a complete project archive.
3. Keep the workflow link in follow-up reasoning. Never infer it from the
   project's latest run or substitute another run's project.

If `get_artifact` is absent, continue with the default Preview/Studio delivery.
Its absence must not block Cloud, Local Codex, or BYOK generation.
