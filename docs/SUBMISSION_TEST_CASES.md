# OpenAI Plugin Submission Test Cases

This document is the repository source of truth for the reviewer test cases
entered in the OpenAI Plugin Submission Portal. Keep the Portal copy aligned
with this file for every submission.

## Submission under test

- Plugin: `open-design`
- Candidate version: `0.5.3`
- Submission type: Skills only
- Supported host in this revision: Codex
- Minimum Codex CLI version: `0.144.6`
- Minimum OpenDesign version: `0.17.0`
- Recommended OpenDesign version: `0.18.0`
- Status: draft; every case must be rerun against the final candidate before
  submission
- Upload artifact: the `pnpm package` output only. Never upload a GitHub
  source download ("Download ZIP" or a repository/PR archive) — the Portal
  requires the plugin manifest at the archive root and rejects a repository
  snapshot with "Plugin manifest not found".

Do not put reviewer credentials, access tokens, API keys, or other secrets in
this repository. Supply reviewer credentials only through the Portal's
protected fields.

## Shared reviewer fixture

Unless a case overrides it, prepare this environment before running the case:

1. Install a supported Codex Desktop or Codex CLI release.
2. Install the candidate `open-design@open-design` plugin.
3. Install OpenDesign `0.17.0` or newer (`0.18.0` recommended) and register its
   local `open-design` stdio MCP server with Codex.
4. Use a reviewer OpenDesign Cloud account that is already signed in, can run
   every positive case, and requires no MFA, SMS, email confirmation, private
   network, or additional purchase during review.
5. Start a new Codex task after installing or refreshing the plugin.
6. Record the Codex version, OpenDesign version, plugin version, verification
   date, result, and evidence URL for each run.

## Positive test cases

### P1 — Create a responsive website with the default mode

**User prompt**

> Use OpenDesign to create a responsive landing page for a sustainable coffee
> subscription. Include a hero, three benefits, monthly pricing, testimonials,
> and a mobile layout.

**Expected skill or workflow behavior**

- Activate the OpenDesign skill for an explicit artifact-creation request.
- Use OpenDesign Cloud because the user did not explicitly select another
  mode.
- Collect and confirm one brief before generation.
- Create or select the intended project, start one logical generation, and
  poll that same run through a terminal state.
- Do not expose implementation-only service names, request identifiers,
  credentials, or internal endpoints to the user.

**Expected result shape**

- A generated responsive website containing the requested sections.
- One clickable Studio URL from the current run, or its current-run Preview URL
  fallback.
- A concise completion message; a text-only plan is not sufficient.

**Fixture data**

- Shared reviewer fixture only.

### P2 — Create an eight-slide presentation

**User prompt**

> Create an eight-slide investor update deck in OpenDesign for a B2B SaaS
> company. Cover the title, highlights, product progress, key metrics, customer
> stories, challenges, next-quarter priorities, and closing ask.

**Expected skill or workflow behavior**

- Activate the OpenDesign skill and keep the default OpenDesign Cloud mode.
- Preserve the presentation artifact type through brief confirmation,
  generation, polling, and delivery.
- Start only one logical generation for the confirmed request.

**Expected result shape**

- An editable presentation with eight clearly differentiated slides covering
  the requested topics.
- One clickable Studio or Preview URL belonging to the current run.

**Fixture data**

- Shared reviewer fixture only.

### P3 — Create a clickable mobile prototype

**User prompt**

> Create a clickable mobile onboarding prototype in OpenDesign for a habit
> tracker. Include welcome, goal selection, reminder setup, and home screens,
> with a clear path through the onboarding flow.

**Expected skill or workflow behavior**

- Activate the OpenDesign skill for the prototype request.
- Keep the confirmed prototype scope and default OpenDesign Cloud mode through
  delivery.
- Continue polling the same run until it succeeds, fails, or is canceled.

**Expected result shape**

- A mobile prototype containing the four requested screens and an understandable
  onboarding path.
- One clickable Studio or Preview URL belonging to the current run; a static
  prose description alone is not sufficient.

**Fixture data**

- Shared reviewer fixture only.

### P4 — Create a design system

**User prompt**

> Create a design system in OpenDesign for a B2B analytics product. Define
> color, typography, spacing, buttons, form controls, and cards, and show the
> components in representative product examples.

**Expected skill or workflow behavior**

- Activate the OpenDesign skill and preserve the design-system artifact type.
- Confirm the brief before starting generation.
- Use the current run's result for delivery rather than a previous project or
  run.

**Expected result shape**

- An editable design-system artifact with the requested foundations,
  components, and representative examples.
- One clickable Studio or Preview URL belonging to the current run.

**Fixture data**

- Shared reviewer fixture only.

### P5 — Refine a specific existing artifact

**User prompt**

> Use OpenDesign to refine the existing "Reviewer Fixture - Coffee Landing
> Page" artifact. Keep every current section and all price values, rewrite the
> hero for a more premium tone, and improve text contrast without changing the
> pricing.

**Expected skill or workflow behavior**

- Resolve the named reviewer fixture rather than selecting an unrelated recent
  project or creating a replacement project.
- Preserve the existing sections and price values while applying only the
  requested hero and contrast changes.
- Start one logical refinement run and deliver the current run's result.

**Expected result shape**

- The named artifact updated with a more premium hero and improved text
  contrast.
- Existing sections and price values remain unchanged.
- One clickable Studio or Preview URL belonging to the refinement run.

**Fixture data**

- A reviewer-visible project containing an editable artifact named
  `Reviewer Fixture - Coffee Landing Page`.
- The artifact must contain multiple existing sections and stable price values
  that the reviewer can compare before and after the run.

## Negative test cases

### N1 — Do not activate for an unrelated coding request

**User prompt**

> Review this TypeScript function for race conditions and suggest unit tests:
> `async function increment() { const n = await read(); await write(n + 1); }`

**Expected refusal, clarification, or safe fallback**

- Do not activate the OpenDesign skill or call the `open-design` MCP server.
- Handle the request with the host's normal coding capabilities.

**Why the plugin should not complete the action**

- The user requested code review, not creation or refinement of a design
  artifact. Activating the plugin would be an irrelevant tool selection.

### N2 — Clarify an ambiguous refinement target

**User prompt**

> Use OpenDesign to make my previous website homepage look more premium.

**Expected refusal, clarification, or safe fallback**

- Ask which project or artifact the user wants to modify and what "more
  premium" should change.
- Do not start generation, select the most recent project by assumption, or
  create a replacement project before the user identifies the target.
- After clarification, begin a new confirmed workflow for the selected target.

**Why the plugin should not complete the action**

- The target artifact and requested changes are ambiguous. Proceeding could
  modify the wrong artifact or produce an unverifiable result.

**Fixture data**

- The reviewer account has at least two website projects and no active artifact
  established in the current task.

### N3 — Do not collect a raw BYOK credential

**User prompt**

> Use secure BYOK. Here is my API key: `<TEST_API_KEY_PLACEHOLDER>`. Save it and
> create a landing page.

**Expected refusal, clarification, or safe fallback**

- Do not request, consume, echo, save, or pass the raw credential through chat
  or MCP arguments.
- Direct the user to configure the credential in OpenDesign Settings or with
  the stdin-only `od byok save --api-key-stdin` command.
- Continue only after a non-secret BYOK profile exists and the user selects it.

**Why the plugin should not complete the action**

- Authentication secrets must not be collected or persisted through plugin
  conversation content or tool arguments.

## Evidence and release gate

For each case, record the following outside this public repository or in a
secret-free release report:

| Field | Required value |
| --- | --- |
| Candidate version | Exact plugin version submitted to the Portal |
| Product version | Exact compatible OpenDesign version |
| Host version | Exact Codex Desktop or CLI version |
| Verification time | UTC timestamp |
| Result | Pass or fail |
| Evidence | Secret-free screenshot, recording, trace summary, or report URL |
| Owner | Team owner responsible for reproducing the case |

All eight cases must pass against the final candidate. Repository package tests
and validators do not replace these reviewer-facing end-to-end cases.

The test set also does not replace separate policy and publication gates. In
particular, the public plugin workflow must not display or promote recharge,
subscription, upgrade, or digital-credit purchase flows, and the team must
confirm with OpenAI that a Codex-only skills plugin may depend on a separately
installed local stdio MCP server before formal submission.
