# Agent installation prompt

Use the following instruction in Codex Desktop or Codex CLI:

> Read the `AGENTS.md` at the root of this repository. Install Open Design
> Cloud into Codex using the **Install into Codex** lane. Verify the installed
> plugin version and the `open-design-cloud` MCP registration. Preserve all
> unrelated plugins, marketplaces, MCP servers, and auth state. Do not edit the
> repository, run OAuth login, publish, push, or start local Open Design
> services. Report exactly what was installed, what was verified, and what
> still requires a new task or real Cloud OAuth.

For this local checkout, the complete one-line prompt is:

> Read `/Users/cheems/cjj_project/open-design-agent-plugins/AGENTS.md` and
> install Open Design Cloud into Codex. Follow the Install lane, verify the
> plugin and MCP registration, do not run OAuth login, and report the result.

After the Agent completes installation, start a new Codex task and invoke
`@open-design-cloud` with a concrete request, for example:

> @open-design-cloud Create a responsive website for an AI analytics startup.
