---
name: chapter-builder
description: Expand a chapter plan into a detailed build-ready blueprint with scenes, character roles, block cadence, dialogue sets, and a stronger consistency checklist aligned with the book's Story Core and support specs.
---

# Chapter Builder

Use this skill when a chapter plan is still too vague to support good prose generation.

## Responsibilities

1. Read the chapter plan and its dependencies under `specs/`.
2. Expand the managed sections:
   `## Scene Blueprint`, `## Character Roles`, `## Block Set`, `## Dialogue Set`, and `## Consistency Checklist`.
3. Keep chapter planning aligned with the book seed, the story pattern, the narrative structure, and the requested rhythm.
4. Use the user's pacing instructions when they are explicit. Otherwise use the seeded block and scene counts.

## Command

Single chapter:

```bash
node tools/chapter-builder.mjs docs/<book-slug> <chapter-id>
```

All chapters:

```bash
node tools/chapter-builder.mjs docs/<book-slug> --all
```

## Workflow

1. Run the command on the target chapter or on all chapters.
2. Read the generated blueprint and refine it when the user prompt requires more specific scenes or roles.
3. Make sure each required character has a distinct chapter job.
4. Make sure each block does real work and ends with changed leverage.
5. Make sure the dialogue set carries pressure, not only exposition.

## Output Standard

- Scenes must be concrete enough to draft directly.
- Character roles must say what each person is doing in this chapter.
- Block sets must define cadence, not only topics.
- Dialogue sets must define who wants what and what stays subtextual.
- The consistency checklist must be strict enough that `chapter-generator` can use it as a real gate.
