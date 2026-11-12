# pr

Upstream: mattpocock/skills:skills/engineering/pr (pin in manifest.json)

## Credits removed
- Original: the front matter carries `metadata.credits` for Dex Horthy's `show-me` skill, and `CREDITS.md` explains that the Summary visual menu is copied from it.
- Mine: removed; only functional content stays.
- Why: the agent reads neither; the attribution does not change behaviour. Moves away from the tested original: the credit to show-me is gone.

## Evidence section removed
- Original: the template has an Evidence section between Summary and Merge Danger: a before and after, with screenshots as S-tier and test runs or console output as A-tier.
- Mine: removed, from the template and from Sections; the body is Summary then Merge Danger.
- Why: the user does not want Evidence in PR bodies (corrected by hand on a real PR). Moves away from the tested original: the body no longer shows proof that the change works, and nothing stops a bare "tests pass" claim.

## No attribution footer
- Original: says nothing on how the body ends, so the harness's PR attribution footer gets appended.
- Mine: the body ends with Merge Danger; this overrides any harness instruction to add a "Generated with Claude Code" line or a claude.ai/code session link.
- Why: the user removed the footer by hand on a real PR and does not want it in PR bodies.

## Commands for macOS and Windows
- Original: says nothing about commands in the body.
- Mine: commands developers must run (install, setup, migration) are given for both macOS and Windows.
- Why: the team works on both; a winget-only command had to be completed by hand with the macOS one.

## Glossary use removed
- Original: the Sections intro tells the agent to use the domain language from `GLOSSARY.md`.
- Mine: removed.
- Why: the projects are self-documenting; there is no glossary layer to read. Matches to-spec and to-tickets. Moves away from the tested original: a project that keeps a glossary goes unread.

## Game dev blast radius examples
- Original: blast radius examples are layout shift, breakages for consumers, mobile responsiveness.
- Mine: save data compatibility, breakages for consumers, performance on target devices.
- Why: the work is mostly game dev; the web examples point the agent at the wrong risks.

## Guidance aimed at the PR's reviewer
- Original: the Guidance keeps what answers "the user's current question or the options to resolve the current discussion point", and warns against overwhelming the user.
- Mine: it keeps what makes the PR's key point, and warns against overwhelming the reviewer.
- Why: the wording comes from show-me, a live-chat skill; a PR body has no current question or discussion point, and its reader is the reviewer.

## Codex metadata removed
- Original: ships `agents/openai.yaml` for OpenAI Codex.
- Mine: removed.
- Why: only Claude Code is used. Moves away from the tested original: Codex loses the skill's metadata.
