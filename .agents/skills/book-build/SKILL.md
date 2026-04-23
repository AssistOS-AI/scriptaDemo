---
name: book-build
description: Aggregate validated chapter plans into generated chapter files, generate visual assets, run a global consistency pass, emit the manifest, and refresh the final lightweight book viewer HTML.
---

# Book Build

Use this skill when the user wants the final assembled book refreshed after spec or chapter changes.

## Responsibilities

1. Treat `docs/BOOKNAME/specs` as authoritative.
2. Extract `## Generated Draft` from chapter plans into `docs/BOOKNAME/chapters`.
3. Generate `build/cover-art.svg`, `build/cover-page.svg`, and `build/opening-page.svg` from `specs/book-design.md`.
4. Run global consistency checks and write `build/consistency-report.json`.
5. Write or refresh `build/manifest.json`.
6. Write or refresh the thin `book.html` shell.

## Command

```bash
node tools/book-build.mjs docs/<book-slug>
```

## Workflow

1. Build only after chapter plans contain the intended generated drafts.
2. Let `book-build` stay an aggregator and checker. Do chapter-level planning and prose work through `chapter-builder` and `chapter-generator`.
3. Review `build/consistency-report.json` if the build reports warnings or failures.
4. If the consistency report flags chapter failures, fix the chapter plans and regenerate rather than patching the intermediate chapter outputs by hand.

## Output Standard

- The final HTML must stay lightweight.
- The manifest must expose both specs and generated chapter outputs.
- Asset generation should remain display-facing and should not duplicate the manuscript in HTML.
- Global consistency checks should catch thin chapters, broken dependencies, and orphaned spec files.
