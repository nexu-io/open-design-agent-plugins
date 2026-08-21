# Distribution telemetry boundary

This document is a design input, not a production telemetry implementation.
Installation, host, and runtime activation are separate facts.

## Required dimensions

Record host and distribution as independent dimensions:

| Dimension | Examples | Meaning |
| --- | --- | --- |
| `hostProduct` | `codex_desktop`, `codex_cli`, `codex_unknown`, `claude_code`, `unknown` | Which bounded agent host OpenDesign observed; use `codex_unknown` when the Codex surface cannot be distinguished reliably |
| `distributionMechanism` | `git_marketplace`, `local_repo`, `manual`, `unknown` | How the plugin package was obtained |
| `publisherClass` | `open_design_first_party`, `third_party`, `unknown` | Whether the distribution source is owned by OpenDesign |
| `pluginVersion` | `0.5.3` | Immutable plugin payload version |

A GitHub repository installation is not a host. For example:

- Codex + OpenDesign Git marketplace:
  `hostProduct=codex_cli`,
  `distributionMechanism=git_marketplace`,
  `publisherClass=open_design_first_party`.
- Claude Code + a community fork:
  `hostProduct=claude_code`,
  `distributionMechanism=git_marketplace`,
  `publisherClass=third_party`.

If source attribution is required, accept only an allowlisted publisher slug or
a privacy-reviewed keyed digest. Never store a raw clone URL, embedded
credential, access token, local path, branch name, user home, or repository
query string.

## Install is not activation

- `install`: authoritative channel/provider receipt that a package was
  installed.
- `cloud_sign_in_success`: Vela authorization completed through OpenDesign.
- `plugin_activation`: first successful protected Cloud operation through the
  local MCP for a consented account.
- `task_start` / `artifact_success`: product funnel stages.

Do not infer install count from Vela sign-in, local MCP initialization,
manifest discovery, or activation. GitHub clone/view/download statistics are
also not equivalent to plugin installs.

If Codex, Claude Code, or a future marketplace does not expose trustworthy
install receipts, keep that channel's install count unknown. A runtime may send
best-effort host/channel labels for diagnostic segmentation, but client headers
are forgeable and must not drive access control, billing, abuse decisions, or
an official install counter.

For this Codex Git marketplace channel, the dashboard contract is therefore
`official_installs=N/A / source_unavailable`. First observed use and activated
installations are separate, explicitly labelled proxy metrics.

## Current implementation facts

The released Vela baseline has a general analytics registry, durable PostgreSQL
storage, optional PostHog fan-out, and an authenticated OpenDesign trace/score
relay. The compatible Vela candidate branch extends that existing analytics
path with bounded Plugin correlation, stable operation/result fields, recovery
correlation, and a destination-specific allowlist/projection for the
OpenDesign PostHog project. It does not create a second billing or analytics
pipeline, and it does not mirror account, payment, balance, cost, prompt, raw
error, or credential data into OpenDesign PostHog.

OpenDesign 0.17.0 and later validate the bounded context, issue the workflow
identifier, persist logical-run and Artifact origin correlation, and emit
telemetry schema v3 through the existing consented OpenDesign analytics path.
The minimum compatible tag `open-design-v0.17.0` resolves to
`90a660add511da6408464a1bf3d4d5945ad06400` and bundles
`@powerformer/vela-cli@0.0.27`. The recommended `release/v0.18.0` branch was
verified at `1a3cfd0fd625736e8b63249b38163c999b741f36` and bundles Vela CLI
`0.0.28`; no `open-design-v0.18.0` tag was observed at verification time. This
release evidence does not by itself prove that Plugin-correlated events reached
production Vela or PostHog.
The released source and package pin are compatibility evidence, not production
evidence for Plugin-correlated event delivery.
There is still no Codex publisher install receipt or `platformInstalls`
implementation; official install count remains unavailable.

The published 0.5.3 Git marketplace distribution declares telemetry schema v3
and sends only this bounded self-reported context on `collect_brief`. A skipped
interactive Brief still calls `collect_brief` once with `skip: true`:

```json
{
  "id": "open-design",
  "version": "0.5.3",
  "distributionMechanism": "git_marketplace",
  "publisherClass": "open_design_first_party"
}
```

OpenDesign 0.17.0 or newer must validate that object, issue one
`pluginWorkflowId`, and carry the workflow through Brief, login, project, run,
terminal delivery, and optional Artifact context. A compatible Vela release
must contain the destination-specific projection before Plugin-attributed Cloud
events are mirrored. Until Vela production validation and a controlled
end-to-end smoke exist, this repository's telemetry metadata is a contract
declaration, not evidence that the events were received.

Before Git-based public distribution is claimed as measured:

1. keep the bounded context and mode-aware workflow pinned to the released
   OpenDesign provenance recorded in `release-manifest.json`;
2. release and production-validate Vela's bounded schemas and safe OpenDesign
   PostHog projection for Cloud-only Plugin correlation;
3. keep `official_installs=N/A / source_unavailable` until a trustworthy
   publisher receipt exists;
4. add privacy, redaction, spoofing, retry, and workflow-mismatch tests;
5. keep unknown or unsupported channels explicit instead of guessing.

The local smoke of this repository is test evidence only and must not be sent
as a production install event.
