# Distribution telemetry boundary

This document is a design input, not a production telemetry implementation.
Installation, host, and runtime activation are separate facts.

## Required dimensions

Record host and distribution as independent dimensions:

| Dimension | Examples | Meaning |
| --- | --- | --- |
| `hostProduct` | `codex_desktop`, `codex_cli`, `claude_code`, `other`, `unknown` | Which agent host loaded or used the plugin |
| `distributionMechanism` | `public_directory`, `git_marketplace`, `local_path`, `workspace_bundle`, `unknown` | How the plugin package was obtained |
| `publisherClass` | `open_design_first_party`, `third_party`, `unknown` | Whether the distribution source is owned by Open Design |
| `pluginVersion` | `0.2.0` | Immutable plugin payload version |

A GitHub repository installation is not a host. For example:

- Codex + Open Design Git marketplace:
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
- `cloud_sign_in_success`: Vela authorization completed through Open Design.
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

## Current implementation fact

Vela currently stores the consent-gated Open Design Cloud funnel and keeps
`platformInstalls: null`. Its event schema supports only
`codex_desktop`, `codex_cli`, and `codex_unknown`, and it has no distribution
mechanism or publisher dimension. The host/version headers are suitable only
for best-effort product analytics.

Before Claude Code or Git-based public distribution is claimed as measured:

1. confirm a durable metrics-consent source;
2. extend the Vela schema and migrations with bounded enums;
3. define the trusted install receipt/source for each channel;
4. add privacy/redaction and spoofing tests;
5. keep unknown/unsupported channels explicit instead of guessing.

The local smoke of this repository is test evidence only and must not be sent
as a production install event.
