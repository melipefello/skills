# prototype

Upstream: mattpocock/skills:skills/engineering/prototype (pin in manifest.json)

## Screen branch only, in one file
- Original: SKILL.md picks between two branches, a logic demo (LOGIC.md) and UI variants (UI.md), and holds six rules shared by both.
- Mine: removed the branch choice, LOGIC.md and the shared rules; SKILL.md holds the screen branch as four steps.
- Why: every prototype the user asked for was a screen to judge by eye; the 208 upstream lines were cut to the one branch in use. Moves away from the tested original: a question about a state model or rules gets no clickable single-file demo with walkthroughs, and no pure logic module to lift into the code.

## Description names screens and mockups
- Original: "Build a throwaway prototype to answer a design question", triggered by a state model or logic check, or exploring a UI.
- Mine: rough throwaway variants of a screen on one page, picked by eye; triggered when the user asks for prototypes or a mockup.
- Why: follows from the screen branch only; "mockup" is the user's own word for it.

## The question includes how the user will use the screen
- Original: identify the question from the prompt, the code, or the user; write a one-line plan.
- Mine: step 1 writes what the screen is for and how the user will use it; when the conversation does not say how, that is asked first as one question.
- Why: one round of prototypes was built before anyone asked how the user works with the thing ("I think you need to dig for the answers with me, in order to build something I like").

## Variant count is the user's number
- Original: default 3, capped at 5.
- Mine: the number the user asked for, 3 when none; no cap.
- Why: the user asks for a count ("4 quick prototypes"); the cap had no use case.

## Rough round first, one agent, one theme
- Original: variants are drafted against the real page with its real data fetching (sub-shape A, preferred) or on a new throwaway route (sub-shape B); nothing says who builds them, and a variant may change anything.
- Mine: a rough round: static screens with made-up data at real density, one page with a switch, in the project's front-end tooling (inside the app's real header and navigation) or one HTML file in `.scratch/<feature>/`; all variants built by the one agent in one pass; one theme across them, structure differs. The sub-shapes, the pseudo-code switcher and the anti-patterns list are removed; the structural-difference and shared-layout lines stay.
- Why: one session built three rounds of three dashboard prototypes, each by its own subagent (10 to 26 minutes and 150K to 330K tokens each, $47 in total); the user threw round 1 away and only glanced at two of round 3. The user judges by eye and prefers a consistent theme. Moves away from the tested original: a rough variant is no longer judged against the page's real data, so a layout that breaks on real content can pass the rough round.

## The switch bar, trimmed
- Original: a shared switcher component with router-specific URL updates, keyboard cycling, a distinct look, and a `NODE_ENV` gate.
- Mine: the same bar and behaviour in one paragraph; the production gate applies only inside the app.
- Why: a single HTML file has no router or production build.

## The skill opens the page
- Original: surface the URL and the variant keys; the user flips through whenever they get to it.
- Mine: opens the page with `Start-Process` (dev server first when in the app), then lists each variant in one line and asks which to build.
- Why: the user gives feedback after seeing results ("It's hard for me to reply to text").

## Full build only for the pick
- Original: once a variant wins, fold it into the real code, rewritten properly.
- Mine: a step 4: another rough round on request; on a pick, one answer line (variant and why); called from an interview or spec, the line goes back there; otherwise the pick is built at full fidelity in the real page and the throwaway page is deleted.
- Why: full-fidelity builds of every variant were the cost; only the picked one earns it. grill-me shows a mockup mid-interview and needs the answer back, not a build.

## Prototype kept on a branch removed
- Original: the prototype is committed to a throwaway branch out of main as a primary source, with a pointer on the implementation issue.
- Mine: removed; a single HTML file stays in `.scratch/<feature>/`, an in-app page is deleted after the pick.
- Why: one user, no issue tracker; specs and their files live in `.scratch/`. Moves away from the tested original: the losing in-app variants are not kept anywhere to re-run.

## Codex metadata removed
- Original: ships `agents/openai.yaml` for OpenAI Codex.
- Mine: removed.
- Why: only Claude Code is used. Moves away from the tested original: Codex loses the skill's metadata.
