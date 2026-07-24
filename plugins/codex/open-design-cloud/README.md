# Open Design Cloud plugin for Codex

This package installs an independent `open-design-cloud` plugin in Codex Desktop and Codex CLI. Its bundled default runtime is the remote Vela service presented to users as Open Design Cloud; Local and Local BYOK remain explicit, separately installed options.

The package does not start `od`, connect to a local daemon, write bearer tokens, or modify the existing Claude plugin and local `open-design` MCP server. Codex owns the installed plugin cache, MCP registration, OAuth state, upgrades, and removal under the plugin namespace.

## Local candidate install

Generate a disposable marketplace outside the repository, then install from a clean, task-specific `CODEX_HOME`:

```bash
OD_CODEX_MARKETPLACE_ROOT="$(mktemp -d /tmp/open-design-codex-marketplace.XXXXXX)"
OD_CODEX_TEST_HOME="$(mktemp -d /tmp/open-design-codex-home.XXXXXX)"
pnpm tools-pack codex-cloud-plugin candidate --output "$OD_CODEX_MARKETPLACE_ROOT"
CODEX_HOME="$OD_CODEX_TEST_HOME" codex plugin marketplace add "$OD_CODEX_MARKETPLACE_ROOT" --json
CODEX_HOME="$OD_CODEX_TEST_HOME" codex plugin list --available --json
CODEX_HOME="$OD_CODEX_TEST_HOME" codex plugin add open-design-cloud@open-design --json
CODEX_HOME="$OD_CODEX_TEST_HOME" codex plugin list --json
CODEX_HOME="$OD_CODEX_TEST_HOME" codex mcp list --json
CODEX_HOME="$OD_CODEX_TEST_HOME" codex plugin remove open-design-cloud@open-design --json
CODEX_HOME="$OD_CODEX_TEST_HOME" codex plugin marketplace remove open-design --json
```

The candidate command validates the portable plugin, copies it into the temporary root, and generates that root's `.agents/plugins/marketplace.json`. It never creates or reads a repository `.agents` marketplace. The isolated Codex home prevents the smoke test from mutating normal user plugin or MCP state. Delete only the two exact temporary roots emitted above after testing.

After the Cloud OAuth service is available, authenticate with `codex mcp login open-design-cloud`.

## Explicit execution modes

Cloud is always the default. The installed Cloud plugin contains only the remote `open-design-cloud` HTTPS MCP server, so a machine without Open Design installed remains fully usable.

Local Codex is an optional, separate registration for users who already run
Open Design locally. It commissions Open Design with the local `codex` runtime
and reuses the authentication owned by `codex login`; Open Design does not
receive or store the OpenAI credential. From the running Open Design app use
Settings → MCP server, or run:

```bash
codex login
od mcp install codex
```

That command resolves the live launch command, data root, and sidecar transport from `/api/mcp/install-info`, then asks Codex to register only the `open-design` stdio MCP server. It does not edit the Cloud plugin, and uninstalling it does not remove `open-design-cloud`. A Cloud authentication, balance, or runtime error never triggers Local automatically.

When Local is selected, the mode-routing skill requires `list_agents` to report
the exact `codex` agent as available and authenticated, then calls
`start_run(..., agent: "codex")`. It never substitutes OpenCode,
`byok-opencode`, Cloud, or another local runtime.

BYOK is an optional Local mode using Open Design's OpenCode-backed runtime and
a daemon-owned secure credential profile. Save a profile from Open Design
Settings or pipe the provider key through stdin in your own terminal:

This mode is independent from Local Codex and is not required when the user
chooses `codex login` + `agent=codex`.

```bash
read -r -s OD_BYOK_KEY
printf '%s' "$OD_BYOK_KEY" | od byok save \
  --label OpenRouter \
  --protocol openai \
  --base-url https://openrouter.ai/api/v1 \
  --model openrouter/free \
  --api-key-stdin
unset OD_BYOK_KEY
od byok test <profile-id>
```

Then install/use the separate `open-design` MCP server. Its
`list_byok_profiles` tool returns only profile ids and masked metadata, and
`start_run` accepts only a `byokProfile` reference. Never paste a provider key
into chat, a command argument, a plugin manifest, an MCP argument/environment
example, or a plaintext config file. Cloud remains the default and a Cloud
failure never selects BYOK automatically.

## Package contract

- `.codex-plugin/plugin.json` is the only Codex plugin manifest.
- `.mcp.json` declares one Streamable HTTP endpoint at `https://mcp.open-design.ai/mcp` with OAuth resource discovery and no embedded credential.
- `open-design-cloud.package.json` pins the package identity, minimum verified Codex CLI version, default Cloud mode, MCP name, and the versioned MCP Apps Custom UI resource URI.
- The package contract records Local Codex as a separate explicit installation
  pinned to `agent=codex` and `authentication=codex-login`; BYOK remains an
  independent secure-profile mode that passes only non-secret references
  through MCP.
- `skills/open-design-mode/SKILL.md` keeps Desktop and CLI mode routing consistent: Cloud by default, Local only by explicit request, and no silent fallback.
- Updating a release requires changing the version in both manifests and rerunning the package validator and Codex installation smoke.
- The temporary marketplace is a development harness, not a public distribution channel. Public installation and compliance evidence are owned by the release-readiness task.
