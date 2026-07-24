# Agent guide

Read `README.md` first. Load only the file relevant to the current operation:

- Codex installation and smoke testing: `docs/INSTALL_CODEX.md`
- Install/activation analytics design: `docs/TELEMETRY.md`
- Generated provenance: `release-manifest.json`

## Boundaries

- Codex is the only supported host in this revision.
- Product code, OAuth, billing, artifact generation, and telemetry services
  belong in the Open Design and Vela repositories.
- Treat `plugins/open-design-cloud/` and
  `.agents/plugins/marketplace.json` as generated distribution payloads.
- Never commit API keys, OAuth tokens, Codex homes, plugin caches, logs, or test
  artifacts.
- Do not add a Git remote or push without explicit owner authorization.
- Do not label OAuth success or first runtime use as an installation.

## Refresh workflow

1. Validate the source package in the Open Design repository.
2. Generate a candidate into a new empty directory outside that repository.
3. Compare the candidate with this repository's generated payload.
4. Replace only the reviewed generated payload and refresh
   `release-manifest.json`.
5. Run the validator and the isolated Codex install/remove smoke.

Minimum validation:

```bash
python3 /Users/cheems/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py \
  plugins/open-design-cloud
```

Use a new temporary `CODEX_HOME` for installation tests and remove that exact
temporary directory after the test.
