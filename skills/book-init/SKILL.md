---
name: book-init
description: Create the first specification tree for a new book under docs/BOOKNAME, including metadata, a general book plan, chapter plans, and support specs for characters, places, concepts, and emotional arcs.
---

# Book Init

Use this skill when the user wants to start a new literary, scientific, or hybrid book from a high-level idea.

## Workflow

1. Derive a clear book slug under `docs/BOOKNAME`.
2. Create `specs/metadata.md`, `specs/book-plan.md`, and `specs/book-design.md`.
3. Create `specs/chapter-plans/` with one Markdown file per chapter.
4. Create supporting spec files under `characters/`, `places/`, `concepts/`, and `emotions/` when they matter to the book.
5. Add richer support groups when the material needs them, such as `themes/`, `mechanics/`, `relationships/`, `motifs/`, or other domain-specific structures.
6. Keep the specification layer as the source of truth. If the user also wants a generated draft, place the draft inside each chapter plan under `## Generated Draft` so the build skill can extract it into `chapters/`.

## Conventions

- Write all specs in Markdown.
- Keep titles, summaries, and dependencies explicit in chapter plan frontmatter.
- Prefer English unless the user explicitly requests another language.
- Keep chapter count coherent in the first pass, but do not make the content thin.

## Quality Bar

- `specs/book-plan.md` should be substantial. Include premise, thematic thesis, chapter arc, world logic, narrative promises, and demo goals for the viewer.
- `specs/book-design.md` should define the visual metadata used by the viewer assets. Treat it as the display-facing source for the book object: title treatment, subtitle, author line, cover badge, cover logline, opening-page quote, opening-page note, palette, and abstract motif direction.
- The cover/opening copy in `specs/book-design.md` should be written for page design, not for synopsis. Keep it concise enough to typeset cleanly inside generated SVG pages.
- Each chapter plan should include more than a short outline. Prefer purpose, emotional motion, scene ladder, reveals, motifs, and any critical dependencies.
- For demo-oriented books, create enough specification files that the source drawer feels real rather than empty. A good default is at least:
  `characters/`, `places/`, `concepts/`, `emotions/`, plus two or three additional support groups such as `themes/`, `mechanics/`, or `relationships/`.
- Unless the user explicitly asks for outline-only output, the initial `## Generated Draft` for each chapter should be substantial prose, not a stub.
- For demo books meant to look full in the viewer, target roughly `1800-3200` words per chapter in the initial generated draft.
- Prefer concrete scenes, dialogue, sensory detail, and continuous narrative paragraphs over compressed synopsis language.
- Avoid underfilled books. If the manuscript would look visually sparse in the viewer, expand the specification depth and chapter drafts before calling the build complete.
- For demo books, prefer abstract cover concepts over literal illustration. The design spec should describe abstract motifs, color direction, cover text, and opening-page text that can be rendered as separate SVG assets.
- Default asset contract for demo books:
  `build/cover-art.svg`, `build/cover-page.svg`, and `build/opening-page.svg`.

## Scaffolding

For a blank scaffold, run:

```bash
node tools/book-init.mjs <book-slug> "Book Title"
```

Then replace placeholders with real plans and drafts.
