---
name: book-build
description: Aggregate validated chapter plans into generated chapter files, generate visual assets, run a global consistency pass, emit the manifest, refresh the lightweight demo viewer, and produce self-contained reading-optimized HTML books in English and Romanian.
---

# Book Build

Use this skill when the user wants the final assembled book refreshed after spec or chapter changes, or when the user wants to produce standalone reading HTML for a book.

## Responsibilities

1. Treat `docs/BOOKNAME/specs` as authoritative.
2. Extract `## Generated Draft` from chapter plans into `docs/BOOKNAME/chapters`.
3. Generate `build/cover-art.svg`, `build/cover-page.svg`, and `build/opening-page.svg` from `specs/book-design.md`.
4. Run global consistency checks and write `build/consistency-report.json`.
5. Write or refresh `build/manifest.json`.
6. Write or refresh the thin `book.html` demo shell.
7. Produce self-contained reading-optimized HTML books in **English** (`docs/en/BOOKNAME/book.html`) and **Romanian** (`docs/ro/BOOKNAME/book.html`).

## Command

```bash
node tools/book-build.mjs docs/<book-slug>
```

## Self-Contained Readers

The build now generates two self-contained HTML files per book:

- `docs/en/<book-slug>/book.html` — English version
- `docs/ro/<book-slug>/book.html` — Romanian version

Each file is a complete, standalone HTML document with:

- All chapter content embedded and pre-rendered as HTML
- SVG cover and opening page assets inlined as base64 data URIs
- Full CSS and JavaScript inline — no external dependencies
- Responsive layout optimized for both desktop and mobile reading
- Navigation bar with chapter jump and table of contents
- Keyboard navigation (arrow keys to jump between chapters)
- Atlas (world overview) section with characters, places, and concepts
- Color scheme derived from `specs/book-design.md`
- Localized UI strings (Chapter/Capitolul, Table of Contents/Cuprins, etc.)

These files can be opened directly in any browser without a web server.

## Workflow

1. Build only after chapter plans contain the intended generated drafts.
2. Let `book-build` stay an aggregator and checker. Do chapter-level planning and prose work through `chapter-builder` and `chapter-generator`.
3. Review `build/consistency-report.json` if the build reports warnings or failures.
4. If the consistency report flags chapter failures, fix the chapter plans and regenerate rather than patching the intermediate chapter outputs by hand.
5. After a successful build, open `docs/en/BOOKNAME/book.html` or `docs/ro/BOOKNAME/book.html` directly in a browser to read.

## Output Standard

- The demo `book.html` must stay lightweight and depends on `preview.js`.
- The self-contained readers in `docs/en/` and `docs/ro/` are fully portable — no server required.
- The manifest must expose both specs and generated chapter outputs.
- Asset generation should remain display-facing and should not duplicate the manuscript in HTML.
- Global consistency checks should catch thin chapters, broken dependencies, and orphaned spec files.
- Both language versions share the same book content (chapters, metadata). Only the UI chrome is localized.