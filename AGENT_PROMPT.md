# Agent installation prompt

Use this instruction in Codex Desktop or Codex CLI:

> Read
> `https://github.com/nexu-io/open-design-agent-plugins/blob/main/AGENTS.md`.
> Install Open Design Cloud into Codex using the **Install into Codex** lane.
> Preserve unrelated plugins, marketplaces, MCP servers, and auth state.
> Connect the plugin to the existing local `open-design` MCP if present. If it
> is absent, verify that Open Design is installed and running, then use its
> Settings → MCP server action or its resolved `od mcp install codex` command;
> never invent a remote MCP URL or a fixed localhost path. Do not perform Vela
> login, edit source, publish, or push. Report the installed plugin version,
> local MCP status, and any remaining Open Design/Vela prerequisite.

After installation, sign in to Vela from Open Design if needed, start a new
Codex task, and invoke:

> @open-design-cloud Create a responsive website for an AI analytics startup.
