# pr

Upstream: mattpocock/skills:skills/engineering/pr (pin in manifest.json)

## Credits removed
- Original: the front matter carries `metadata.credits` for Dex Horthy's `show-me` skill, and `CREDITS.md` explains that the Summary visual menu is copied from it.
- Mine: removed; only functional content stays.
- Why: the agent reads neither; the attribution does not change behaviour.

## No test run in Evidence
- Original: the template's before/after placeholders name a failing and a passing test run, and A-tier evidence is test results or console output, showing the exact test that now fails and passes.
- Mine: the placeholders are screenshot or output; A-tier evidence is console or log output from a run, before and after.
- Why: no TDD for now (as in to-spec); the agent should not hunt for or write a failing test to fill the section. The before/after rule still stops a bare "tests pass" claim.

## Glossary use removed
- Original: the Sections intro tells the agent to use the domain language from `GLOSSARY.md`.
- Mine: removed.
- Why: the projects are self-documenting; there is no glossary layer to read. Matches to-spec and to-tickets.

## Game dev blast radius examples
- Original: blast radius examples are layout shift, breakages for consumers, mobile responsiveness.
- Mine: save data compatibility, breakages for consumers, performance on target devices.
- Why: the work is mostly game dev; the web examples point the agent at the wrong risks.

## Codex metadata removed
- Original: ships `agents/openai.yaml` for OpenAI Codex.
- Mine: removed.
- Why: only Claude Code is used.
