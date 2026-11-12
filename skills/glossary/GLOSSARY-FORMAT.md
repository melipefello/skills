# GLOSSARY.md Format

## Structure

```md
# {Context Name}

{One or two sentence description of what this context is and why it exists.}

How to use this file:
- Write the terms below in every text the user reads: chat, screen text, docs, tickets. In code, match the names around your change; `_Code_` gives the identifier where it differs from the term.
- When the user writes an `_Avoid_` name, answer with the term and note it once per conversation: "purchase" = **Order**. The user keeps the term or renames it.
- When your work needs a name this file lacks, pick one, add it under To confirm, and list it in your report.
- Language changes on the user's word only.

## Language

**Order**:
{A one or two sentence description of the term}
_Avoid_: Purchase, transaction
_Code_: `Txn`

**Invoice**:
A request for payment sent to a customer after delivery.
_Avoid_: Bill, payment request

**Customer**:
A person or organization that places orders.
_Avoid_: Client, buyer, account

## To confirm

**Refund**:
{A one or two sentence description of the term}
```

## Rules

- **Be opinionated.** When multiple words exist for the same concept, recommend the best one; the user picks, and the others go under `_Avoid_`.
- **Keep definitions tight.** One or two sentences max. Define what it IS, not what it does.
- **Only include terms specific to this project's context.** General programming concepts (timeouts, error types, utility patterns) don't belong even if the project uses them extensively. Before adding a term, ask: is this a concept unique to this context, or a general programming concept? Only the former belongs.
- **Cover what the user sees.** Every clash gets an entry, and so does each main thing on the user's screens, even one with a single name.
- **Group terms under subheadings** when natural clusters emerge. If all terms belong to a single cohesive area, a flat list is fine.
- **`_Code_` only where it differs.** One identifier: the name the code uses for the thing when that is not the term. It is the one implementation detail the file holds.
- **To confirm holds the names an agent picked.** The next naming session or grill opens with them; a confirmed entry moves to Language.
- **Copy the How to use block verbatim** into every new `GLOSSARY.md`: it is how sessions that never load this skill learn the rules.
