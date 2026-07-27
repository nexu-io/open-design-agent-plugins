# Agent installation prompt

Use this instruction in Codex Desktop or Codex CLI:

> Read
> `https://github.com/nexu-io/open-design-agent-plugins/blob/main/AGENTS.md`.
> Install Open Design Cloud into Codex using the **Install into Codex** lane.
> Preserve unrelated plugins, marketplaces, MCP servers, and auth state.
> Connect the plugin to the existing local `open-design` MCP if present. If it
> is absent, verify that Open Design 0.17.0 or newer is installed. If it is
> missing or older, ask before opening `https://open-design.ai/download/`; do
> not silently run an installer. If it is installed, use its resolved signed
> headless MCP-install operation.
> Never invent a remote MCP URL, a fixed localhost path, or a source checkout
> path. Preserve the user's explicit choice between Vela Cloud, Local Codex,
> and secure BYOK. Do not edit source, publish, or push. Report the installed
> plugin version, local MCP status, and any remaining prerequisite.

After installation, start a new Codex task and invoke:

> @open-design-cloud Create a responsive website for an AI analytics startup.
