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
`skills/book-init/SKILL.md`

Purpose:
- Create the first spec tree for a new book.
- Create metadata, a general book plan, chapter plans, and support spec files.
- Prefer rich specs and substantial initial chapter drafts for demo-quality books.

Scaffold command:

```bash
node tools/book-init.mjs <book-slug> "Book Title"
```

### `book-build`

File:
`skills/book-build/SKILL.md`

Purpose:
- Read the spec layer.
- Extract generated draft sections into `docs/BOOKNAME/chapters`.
- Generate `build/cover-art.svg`, `build/cover-page.svg`, and `build/opening-page.svg` from `specs/book-design.md`.
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

2. Fill the spec files under:

```text
docs/my-book/specs/
```

At minimum:
- `metadata.md`
- `book-plan.md`
- `book-design.md`
- `chapter-plans/*.md`
- support specs in folders such as `characters/`, `places/`, `concepts/`, `emotions/`

For stronger demos, also add:
- `themes/`
- `mechanics/`
- `relationships/`

3. Make sure each chapter plan contains a substantial `## Generated Draft` section.

4. Build the book:

```bash
node tools/book-build.mjs docs/my-book
```

5. Open the result:

```text
docs/my-book/book.html
```

## Demo Notes

- The viewer is implemented in `docs/preview/preview.js`.
- The build writes viewer data to `docs/BOOKNAME/build/manifest.json`.
- The cover/opening display assets come from `specs/book-design.md` and are emitted as separate SVG files under `docs/BOOKNAME/build/`.
- The source drawer in the viewer can expose both specs and generated chapter outputs.
- For a good demo, prefer books with enough prose to fill many pages rather than a few short scenes.

## Current Example

This repo already contains one generated example:

```text
docs/the-hollow-fifth/
```

Use it as the reference shape for future books.
