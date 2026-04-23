---
name: chapter-generator
description: Generate or regenerate a chapter draft from the structured chapter plan, validate it against the Story Core and support specs, and retry until chapter-level consistency is acceptable.
---

# Chapter Generator

Use this skill when the user wants actual chapter prose, not only planning.

## Responsibilities

1. Gather the chapter generation packet from the current specs.
2. Generate all planned elements inside `## Generated Draft` in the chapter plan source file.
3. Validate the draft against the chapter plan and general specs.
4. If validation fails, revise the draft and rerun validation until it passes or only acceptable warnings remain.
5. Treat the chapter plan as authoritative. Do not manually treat `docs/BOOKNAME/chapters/*.md` as the source of truth.

## Commands

Get the generation packet:

```bash
node tools/chapter-generator.mjs docs/<book-slug> <chapter-id> --json
```

Validate the draft:

```bash
node tools/chapter-generator.mjs docs/<book-slug> <chapter-id> --validate
```

## Workflow

1. Run `chapter-builder` first if the chapter plan is not yet detailed enough.
2. Run `chapter-generator.mjs --json` and use the output as the drafting packet.
3. Write the prose into the chapter plan's `## Generated Draft`.
4. Run `chapter-generator.mjs --validate`.
5. If validation fails, revise and rerun. The retry loop is part of the skill, not an optional extra.
6. After the chapter passes, use `book-build` to extract and aggregate.

## Validation Standard

- Required characters, places, concepts, events, and key objects must actually appear.
- The draft should meet the chapter's block and scene density expectations.
- Planned dialogue should leave visible traces in the prose.
- Placeholder scaffold text is never acceptable.
- If the user asked for a highly specific thematic or tonal result, verify that after the structural checks.
