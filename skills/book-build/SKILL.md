---
name: book-build
description: Build a book from Markdown specifications by extracting generated chapter drafts from specs, updating docs/BOOKNAME/chapters incrementally, and assembling docs/BOOKNAME/book.html plus a manifest for docs/preview/preview.js.
---

# Book Build

Use this skill when the user wants to regenerate chapter materials or refresh the final viewer for a specific book.

## Workflow

1. Treat `docs/BOOKNAME/specs` as the source of truth.
2. Read `specs/metadata.md` for book metadata and chapter order.
3. Read `specs/book-design.md` for visual metadata and display-facing book text.
4. For each chapter plan, extract the `## Generated Draft` section into `docs/BOOKNAME/chapters`.
5. Use each chapter plan's `dependsOn` frontmatter to decide whether a chapter must be regenerated.
6. Generate separate SVG assets for the book's cover art, cover page, and opening page under `docs/BOOKNAME/build/`.
7. Write or refresh `docs/BOOKNAME/build/manifest.json`.
8. Write or refresh the thin `docs/BOOKNAME/book.html` shell that loads `docs/preview/preview.js`.

## Content Density Expectations

- The build skill should not silently bless skeletal content. If chapter drafts are obviously too thin for the demo viewer, treat that as a content gap to fix at the specification layer.
- Preserve rich drafts exactly; do not compress them while extracting from the chapter plans.
- Expect the viewer to work best when the book has many pages worth of prose, not just a few short scenes.
- Include secondary source materials in the manifest so specs and generated drafts can be inspected without replacing the primary reading experience.
- Treat `specs/book-design.md` as the primary source for cover/opening display copy. The viewer should not duplicate that text with ad hoc HTML overlays when the SVG assets already carry the layout.
- Prefer abstract SVG compositions driven by the design spec instead of literal scene illustration unless the user asks otherwise.
- The SVG assets should be usable as page art on their own. Prefer a cover-page composition that reads like a printed edition, and an opening-page composition that reads like an interior leaf, with typography and spacing adapted to the actual text length.

## Command

```bash
node tools/book-build.mjs docs/<book-slug>
```

## Validation

- Run the build twice when practical.
- On the second run, unchanged chapter inputs should remain unchanged.
- Do not manually edit generated chapter files unless you also update the source specs.
