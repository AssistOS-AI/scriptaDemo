# AGENTS.md

This repository is a reusable workspace for specification-driven book production.

## Project View

Think of the project in three layers:

1. Specification layer
   `docs/BOOKNAME/specs`
   This is the source of truth.
   It contains the book plan, chapter plans, `book-design.md`, and support specs such as characters, places, concepts, themes, mechanics, relationships, and emotional arcs.

2. Generated intermediate layer
   `docs/BOOKNAME/chapters`
   These Markdown files are extracted from the chapter plans, mainly from each chapter plan's `## Generated Draft` section.

3. Final demo/viewer layer
   `docs/BOOKNAME/book.html`
   This is a thin HTML shell that loads the reusable viewer in `docs/preview/preview.js`.

The final HTML should stay lightweight. The real book content lives in Markdown and is assembled by the viewer.

## Main Rules

- Treat `docs/BOOKNAME/specs` as authoritative.
- Do not manually treat `book.html` as the manuscript.
- If generated chapter files need changes, prefer changing the specs first and rebuilding.
- Build incrementally whenever possible instead of rebuilding unrelated work.
- Treat `specs/book-design.md` as the display-facing source for cover/opening text, palette, and abstract SVG direction.

## Available Local Skills

### `book-init`

File:
`.agents/skills/book-init/SKILL.md`

Purpose:
- Create or refresh the full seeded spec tree for a new book.
- Generate `story-core.md` plus richer support groups for characters, archetypes, evolution, locations, wisdom, world building, plot elements, special objects, events, concepts, relations, story pattern, narrative structure, theme, and emotions.
- Use deterministic seeded literary-theory catalogs for surprising but reproducible defaults.

Scaffold command:

```bash
node tools/book-init.mjs <book-slug> "Book Title"
```

### `chapter-builder`

File:
`.agents/skills/chapter-builder/SKILL.md`

Purpose:
- Expand a chapter plan into detailed scenes.
- Define each character role in the chapter.
- Define a set of blocks and a set of dialogues.
- Strengthen the chapter-level consistency checklist before prose generation.

Command:

```bash
node tools/chapter-builder.mjs docs/<book-slug> <chapter-id>
```

Or for all chapters:

```bash
node tools/chapter-builder.mjs docs/<book-slug> --all
```

### `chapter-generator`

File:
`.agents/skills/chapter-generator/SKILL.md`

Purpose:
- Read the Story Core, chapter plan, and support specs.
- Generate all chapter elements into `## Generated Draft`.
- Validate chapter consistency against the general specs and the generated Markdown.
- Retry/regenerate until the chapter passes the consistency bar.

Core commands:

```bash
node tools/chapter-generator.mjs docs/<book-slug> <chapter-id> --json
node tools/chapter-generator.mjs docs/<book-slug> <chapter-id> --validate
```

### `book-build`

File:
`.agents/skills/book-build/SKILL.md`

Purpose:
- Aggregate generated chapters from the specification layer.
- Generate `build/cover-art.svg`, `build/cover-page.svg`, and `build/opening-page.svg` from `specs/book-design.md`.
- Check global consistency and emit `docs/BOOKNAME/build/consistency-report.json`.
- Produce `docs/BOOKNAME/build/manifest.json`.
- Produce or refresh `docs/BOOKNAME/book.html`.

Build command:

```bash
node tools/book-build.mjs docs/<book-slug>
```

## How To Generate A Book Quickly

1. Initialize the book scaffold:

```bash
node tools/book-init.mjs my-book "My Book"
```

2. Refine the seeded Story Core and support files under:

```text
docs/my-book/specs/
```

At minimum:
- `metadata.md`
- `story-core.md`
- `book-plan.md`
- `book-design.md`
- `chapter-plans/*.md`
- support specs in folders such as `characters/`, `places/`, `concepts/`, `relationships/`, `themes/`, `events/`, `special-objects/`, `world-building/`

3. Expand the chapter plans into detailed blueprints:

```bash
node tools/chapter-builder.mjs docs/my-book --all
```

4. Generate or regenerate each chapter draft in the chapter plan source, validating after each pass:

```bash
node tools/chapter-generator.mjs docs/my-book 01-your-chapter-id --json
node tools/chapter-generator.mjs docs/my-book 01-your-chapter-id --validate
```

5. Build the book:

```bash
node tools/book-build.mjs docs/my-book
```

6. Open the result:

```text
docs/my-book/book.html
```

## Demo Notes

- The viewer is implemented in `docs/preview/preview.js`.
- The build writes viewer data to `docs/BOOKNAME/build/manifest.json`.
- The build writes a global QA report to `docs/BOOKNAME/build/consistency-report.json`.
- The cover/opening display assets come from `specs/book-design.md` and are emitted as separate SVG files under `docs/BOOKNAME/build/`.
- The source drawer in the viewer can expose both specs and generated chapter outputs.
- For a good demo, prefer books with enough prose to fill many pages rather than a few short scenes.

## Current Example

This repo already contains one generated example:

```text
docs/the-hollow-fifth/
```

Use it as the reference shape for future books.
