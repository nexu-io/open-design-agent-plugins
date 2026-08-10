---
name: open-design-mode
description: Create and refine websites, slides, prototypes, and design systems through the local Open Design MCP. Use Open Design Cloud by default, or Local Codex and secure BYOK only when the user explicitly selects them.
---

# Open Design execution mode

Use this workflow whenever a user asks the Open Design plugin to create
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

Open Design Cloud is the default mode. It uses the local Open Design daemon and
its bundled cloud runtime. Local Codex and BYOK are available only when the
user explicitly selects them.

Resolve the execution mode from the user's current request before calling
`collect_brief`. An explicit choice such as Local Codex, Open Design Cloud, or
secure BYOK remains selected through Brief collection, confirmation, project
selection, generation, polling, and terminal delivery for that logical
generation.

Never silently switch modes because authentication, balance, transport, quota,
runtime, or generation failed. Mode-switch recovery choices apply only to
Open Design Cloud and secure BYOK; they never apply to Local Codex. When Local
Codex is selected, report the blocker and never offer or invoke Open Design
Cloud or secure BYOK after an authentication, quota, transport, runtime, or
generation failure. Retry only the same Local Codex route after the blocker is
resolved.

When Open Design Cloud or secure BYOK is selected, explain the failure and
offer applicable choices such as retrying the selected mode, completing its
authentication, or switching to the other non-Local mode. State when the
alternative uses an Open Design Cloud account or a BYOK provider account.
Switch only after the user explicitly confirms the new mode.

After an explicit Open Design Cloud or secure BYOK switch, start a new execution
context and request identifier. Reuse only the human-readable confirmed brief;
never repeat its signed machine envelope. The selected mode may change between
logical generations, but one logical generation must never drift between
modes.

## Keep implementation names out of user-facing copy

Match status updates, errors, and final delivery prose to the language of the
user's current request. In user-facing text, use only these product terms:
Open Design Cloud, Local Codex, secure BYOK, and Open Design Cloud account or
credits.

Some MCP tool names and machine parameters below retain compatibility
identifiers such as `get_vela_login_status`, `start_vela_login`, and `amr`.
Treat them as machine-only protocol values. Never quote, explain, or expose
those identifiers, raw agent selectors, internal endpoints, or service account
names in user-facing prose. Translate tool errors into the product terms above
without changing the actual MCP argument values.

Before every `collect_brief` call, derive a normalized BCP-47 `locale` from the
language of the user's current message and pass it to the tool. For example,
use `zh-CN` for a Simplified Chinese request and `en` for an English request.
Use the Host UI locale only when the current message language is genuinely
indeterminate, then fall back to `en`. Keep question ids, option values,
artifact types, and other machine fields unchanged across locales.

## Start one attributed workflow

This first-party Git marketplace package uses this exact bounded
`externalPluginContext`:

```text
externalPluginContext = {
  id: "open-design",
  version: "0.5.3",
  distributionMechanism: "git_marketplace",
  publisherClass: "open_design_first_party"
}
```

Do not add host names, paths, branch names, prompts, brief answers, account
data, or credentials.

1. Send `externalPluginContext` with `collect_brief`. When the current context
   already provides a complete brief, call `collect_brief` exactly once with
   `skip: true`, the required attribution, and the current locale. If the user
   explicitly skips interactive questions, use that same one-call path. When
   material brief details are missing, call `collect_brief` once without
   skipping and let the user complete that same card.
   For one logical artifact request, call `collect_brief` exactly once. If its
   card is still loading, wait for that same card to receive its result; do not
   issue a second `collect_brief` to replace it. Only a new artifact request or
   an explicit user restart begins another Brief workflow.
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

### If the brief card cannot render

The MCP tool must remain usable when the Host cannot render its optional UI.
If Codex reports that the MCP app or its sandbox failed to load, do not call
`collect_brief` again. Read `questionForm` from that call's structured result,
present the same labels and human-readable options as a compact plain-text
question in the current task, and wait for the user's choices. Then call
`confirm_brief` once with the original `briefDraftId`, `nonce`, normalized
answer values, locale, and workflow context.

Never expose or ask the user to copy `briefDraftId`, `nonce`, option ids, a
signed confirmation, or other machine fields. This is a presentation fallback
only: it must preserve the same draft, attribution, execution mode, and
one-confirmation rule.

## One confirmed action, one request

After the brief and execution mode are confirmed, create one opaque stable
`requestId` for that logical generation. Across every mode, the only
`start_run` retry exception is when its initial response is lost before any
`start_run` response or `runId` is observed. In that case only, retry
`start_run` byte-identically with the same arguments, `requestId`, and
`pluginWorkflowId`. After any `start_run` response or `runId` is observed,
ordinary reconnect and polling recovery use only `get_run`.

- Call `start_run` once for the confirmed action, except for the bounded
  lost-response retry above.
- Use only `get_run` to poll. Polling must never call `start_run` again.
- Keep the same `requestId` and `pluginWorkflowId` for that one retry exception
  and for an explicit Cloud recharge resume. The workflow id attributes the
  whole Plugin journey; the request id deduplicates one confirmed generation.
- A changed prompt, project, confirmed mode, agent, or BYOK profile is a new
  logical generation and receives a new `requestId`.
- Never reuse a `requestId` with different arguments.
- Never display a request id as user-facing content.

## Keep the current task alive through terminal delivery

After `start_run` returns a `runId`, preserve it and follow this gate in every
mode:

1. Inspect the exact `start_run` result and every later `get_run` result for
   this `runId`. On Codex Desktop, as soon as the current run first returns a
   `studioUrl` while `queued` or `running`, immediately open that exact URL
   with the callable host-provided in-app Browser. Open it exactly once for
   this run; later polls and terminal delivery must not open a duplicate tab.
   If no `studioUrl` exists yet, keep polling instead of opening a URL copied
   from another run or project.
2. Continue polling the same `runId` with `get_run` and the same
   `pluginWorkflowId`, normally every 30–60 seconds.
3. Do not end the current task while `get_run` reports `queued` or `running`.
   A concise progress update is allowed, but continue the polling loop in this
   task. Never promise that a later message will arrive after the current task
   ends.
4. Stop polling only for a terminal state, an explicit recharge/user-input
   boundary, or an explicit user request to cancel.
5. For `succeeded`, prefer the exact `studioUrl` returned by this run and fall
   back to the exact `previewUrl`. Render the selected value as a clickable
   Markdown link. Never copy a URL from another run, project, tool history, or
   a previously rendered output panel.
6. If a successful result contains neither URL, say that the artifact was
   generated but no usable delivery link was returned. Preserve the tool
   result for diagnosis and do not claim complete delivery. Do not call
   `get_artifact` merely to manufacture a link.
7. For `failed` or `canceled`, report that terminal result clearly and do not
   present a stale link as success.

On Codex Desktop, when no running-state Studio tab was opened but the host
exposes a callable host-provided in-app Browser capability, immediately use it
to open the selected terminal link exactly once before the final response. This
is a required delivery fallback whenever that capability is available, not an
optional suggestion, and must not wait for the user to ask for a preview or
remind the agent to open it. Do not install another plugin, substitute the
system browser, or claim the link was opened unless the Browser call succeeded.

In Codex CLI, when the Browser capability is unavailable, or if its call fails,
return the clickable link and explain the open-action limitation without
treating it as a generation failure. Repeated polls, transport retries,
recharge resume, and repeated terminal reads must not open duplicate tabs for
the same deliverable.

## Open Design Cloud workflow

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
4. Call `list_agents` with the workflow id and require the machine-only `amr`
   runtime selector.
5. Check `get_active_context` or list/create the target project, always carrying
   the workflow id.
6. Create one `requestId`, then call `start_run` with that `requestId` and
   `pluginWorkflowId`, plus `agent: "amr"`. Do not substitute `codex`,
   `opencode`, `byok-opencode`, or another runtime.
7. Follow the terminal delivery gate above for this exact run.

Never request, copy, or store a cloud credential in chat or plugin files. Tell
the user that their Open Design Cloud account bears Cloud usage costs.

If `get_run` reports insufficient balance:

1. Preserve the confirmed brief, project, run id, original `requestId`, and
   original `start_run` arguments.
2. Show the returned recharge URL and wait for the user to say that top-up is
   complete. Do not loop automatically.
3. After that explicit confirmation, call `start_run` with the exact original
   arguments, `requestId`, and `pluginWorkflowId`, plus `resume: true`.
4. Continue polling the same logical run with `get_run` and the same workflow
   id.

Do not create another project or logical run, and do not infer whether the
account was charged. Open Design Cloud owns the remote operation, credits, and
billing truth.

## Local Codex workflow

Use this only when the user explicitly chose Local Codex.
The official Local Codex route uses only `agent: "codex"` and the user's
existing Codex login.
Once selected for a logical generation, this route is locked through terminal
delivery.

### Resolve exact current-task settings

Before Brief or project work, resolve the exact settings of the current Codex
task:

1. Prefer host-provided active-task metadata. Capture an exact `model`,
   reasoning effort, and service tier only when the current task explicitly
   supplies each setting. Keep service tier as a separate optional value.
2. When the host does not directly expose those exact values, use the current
   task binding in `CODEX_THREAD_ID` only to locate this task's latest
   authoritative `turn_context` in the local Codex session store. Read the
   explicitly selected `model`, reasoning effort, and service tier from that
   record. Do not inspect unrelated task records.
3. Never print, log, persist, or expose the thread or session identifier. Use
   it only as the lookup key and discard it from all prompts, MCP arguments,
   reports, and user-facing text.
4. Never guess, clamp, substitute, or reinterpret an explicitly selected model,
   reasoning effort, or service tier.

Call `list_agents` with the workflow id and require the exact `codex` agent plus
`chatgptAuthStatus: "ok"` before generation. Treat `chatgptAuthMessage` only as
a non-secret diagnostic explanation. If `chatgptAuthStatus` is absent or has
any value other than `ok`, report a visible blocker and do not call `start_run`.
Do not request, expose, or pass an OpenAI API key. After this preflight, the
runtime automatically injects its optional machine-only
`codexAuthMode: "chatgpt"` for the final Codex agent; do not derive or override
that field from task metadata or the prompt.

When the task has an explicit model or reasoning setting, require the runtime
to prove compatibility with every explicit value. If explicit model or
reasoning compatibility cannot be proven, stop with a visible blocker before
generation. Do not start a run with inferred or downgraded settings.

When a setting is absent from both authoritative sources, omit the
corresponding field from `start_run`. State in the result that the child used
its CLI default for that setting and that execution parity is unconfirmed; an
absent setting is not permission to invent a value.

### Build the one Local Codex run

1. Start the attributed workflow above and confirm the requested artifact type
   and readable brief. If the current context already provides a complete brief,
   call `collect_brief` exactly once with `skip: true`.
2. Check `get_active_context` or list/create the target project with the same
   workflow id.
3. Build the `start_run` prompt from the user's confirmed brief, then append
   this child-runtime boundary:

   > This run is already the selected Local Codex execution inside Open
   > Design. Work directly in the current Open Design project. Do not invoke
   > `@open-design`, the `open-design` MCP server, `collect_brief`, Open Design
   > Cloud login, or another Open Design Plugin workflow. Do not route this
   > request through Open Design again.

4. Create one `requestId`. Call `start_run` exactly once with the same
   `pluginWorkflowId`, the exact prompt and project, and `agent: "codex"`.
   When the corresponding current-task values are explicit, also pass
   `model: "<exact-current-model>"` and
   `reasoning: "<exact-current-effort>"`.
   The MCP schema field is `reasoning`; do not send `effort` or
   `reasoning_effort`. Keep `serviceTier` separate and omit it unless the
   current task explicitly selected an exact service tier.
5. Use only `get_run` after `start_run`. Poll the same `runId`, request, and
   workflow to a terminal state. Ordinary polling never retries `start_run`.
   If and only if transport loses the initial `start_run` response before any
   `start_run` response or `runId` is observed, retry `start_run` byte-identically
   with the same `pluginWorkflowId`, `requestId`, project, prompt, `agent`, and
   the same presence or absence and values for `model`, `reasoning`, and `serviceTier`.
   This idempotent recovery returns the same logical run and must never create
   a duplicate. Once any `start_run` response
   or `runId` is observed, use only `get_run` for reconnect and polling recovery.

Where the host's nested tool boundary can release the packaged runtime between
tool calls, use a single long-lived code-mode/orchestration call that owns
`start_run` and every `get_run` poll. That same underlying call may yield
progress without ending while it waits and polls; do not split start and poll
across short-lived tool invocations.

Do not offer or invoke another execution mode when this Local Codex route is
unavailable, incompatible, unauthenticated, out of quota, or interrupted.
Report the exact blocker and retry only the same Local Codex route after the
user resolves it. Preserve the one workflow, request, and run identity.

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
7. Follow the terminal delivery gate above for this exact run.

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
