---
name: book-init
description: Create or refresh a seeded book specification tree under docs/BOOKNAME with a rich Story Core, structured support specs, seeded literary theory picks, and chapter-plan scaffolding designed for later chapter building and generation.
---

# Book Init

Use this skill when the user wants a new book scaffold or wants an existing scaffold upgraded into a much richer specification system.

## Responsibilities

1. Treat `docs/BOOKNAME/specs` as the source of truth.
2. Build a seeded `story-core.md` that captures deterministic but surprising choices:
   archetypes, relations, story pattern, narrative structure, themes, plot elements, objects, event spine, and pacing profile.
3. Create or refresh the support groups expected by this repo:
   `characters/`, `archetypes/`, `evolution/`, `places/`, `wisdom/`, `world-building/`, `plot-elements/`, `special-objects/`, `events/`, `concepts/`, `relationships/`, `story-patterns/`, `narrative-structures/`, `themes/`, `emotions/`, plus `chapter-plans/`.
4. Keep randomization deterministic by using the book seed. Do not improvise generic defaults when the seeded catalog already gives a stronger option.
5. If the user prompt clearly specifies genre, theme, rhythm, or structure, treat the prompt as higher priority than the seeded default.

## Command

Start from the scaffold command:

```bash
node tools/book-init.mjs <book-slug> "Book Title"
```

Useful optional flags:

```bash
node tools/book-init.mjs <book-slug> "Book Title" \
  --chapterCount 6 \
  --genre "Speculative fiction" \
  --tone "Cold, lyrical, strategic" \
  --premise "..."
```

## Workflow

1. Run `book-init.mjs` to lay down the seeded structure.
2. Read `specs/story-core.md`, `specs/book-plan.md`, and `specs/metadata.md`.
3. Replace placeholders with user-specific material.
4. Keep the seeded literary-theory picks where the prompt leaves freedom.
5. If the user wants a strong first pass, immediately run `chapter-builder` on all chapters after initialization.

## Quality Bar

- The scaffold must already contain meaningful structure, not just empty folders.
- `story-core.md` should be the contract for what was chosen randomly and why.
- Chapter plans should already carry scene count, block count, required entities, and dialogue modes.
- Avoid bland protagonist/mentor/antagonist defaults unless the user asked for them.
- Prefer unusual but coherent combinations over "most likely" combinations.
