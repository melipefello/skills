---
name: prototype
description: Build rough throwaway variants of a screen on one page, so the user picks one by eye. Use when the user asks for prototypes or a mockup.
---

# Prototype

A prototype is **throwaway code that answers a question**. The question decides the shape.

Here the question is what a screen should look like, and the user answers it by eye. Work in two rounds: a **rough** round of several variants on one page, then a full build of the one variant the user picks.

## 1. State the question and pick N

Write the question in one line: what the screen is for and how the user will use it. When the conversation does not yet say how the user will use it, ask that as one question and wait for the answer.

N is the number of variants the user asked for, and 3 when they named none.

Done when the line is written and N is set.

## 2. Build the rough round

Build all N variants yourself, in one pass: one agent holding the whole set keeps the theme consistent and the cost to one context. Rough means:

- **Static screens with made-up data** at real density: realistic names, numbers and counts, held in the page itself.
- **One page** with a switch between the variants. Use the project's existing front-end tooling when it has one: a throwaway page that follows its routing convention, inside the app's real header and navigation. Otherwise, one self-contained HTML file in `.scratch/<feature>/`. Name it so a casual reader can see it's a prototype, not production.
- **One theme** for every variant: the project's look when it has one. Variants must be **structurally different**: different layout, different information hierarchy, different primary affordance, not just different colours. A shared `<Header>` is fine; a shared `<Layout>` defeats the point.

Put the question line at the top of the page.

The switch is a small fixed-position bar at the bottom-centre of the screen with three pieces:

- **Left arrow**: cycles to the previous variant (wraps around).
- **Variant label**: shows the current variant key and, if the variant exports a name, that name too. e.g. `B (Sidebar layout)`.
- **Right arrow**: cycles forward (wraps around).

Clicking an arrow updates a `?variant=` URL search param, so the variant is reload-stable. The `←` and `→` keys also cycle, except while an `<input>`, `<textarea>` or `[contenteditable]` is focused. Make the bar visually distinct from the page (e.g. high-contrast pill, subtle shadow), and inside the app hide it in production builds.

Done when every variant renders and the switch cycles through all of them.

## 3. Open it for the user

Open the page in the user's browser with PowerShell `Start-Process <file or URL>`, after starting the project's dev server when the page lives in the app. In chat, give one line per variant: its key and what sets it apart, then ask which one to build. The interesting feedback is usually **"I want the header from B with the sidebar from C"**, which is the actual design they want.

Done when the browser shows the page and the user has the list.

## 4. Build the pick

When the user asks for another rough round, take step 2 again with what they said. When they pick (one variant, or parts of several), state the answer in one line: the variant and why.

- Called from an interview or a spec: hand that line back to it; the full build comes from there.
- Otherwise: build the pick at full fidelity, in the real page, with real data and the project's components. Rewrite it properly as you fold it in: the variant code was written under prototype constraints. Then delete the throwaway page and the switch from the app.

Done when the answer line is written and, for a build, the pick runs in the real page with no throwaway page left in the app.
