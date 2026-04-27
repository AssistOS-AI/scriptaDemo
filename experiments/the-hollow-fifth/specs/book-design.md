---
title: Book Design
summary: Visual metadata and abstract SVG directions for the book cover, cover page, and opening page.
displayTitle: The Hollow Fifth
displaySubtitle: A philosophical science-fantasy novella
displayAuthor: Codex Collaborative Draft
displayGenre: Philosophical Science Fantasy
displayTone: Lyrical, lucid, unnerving, wonder-struck
coverBadge: Fifth-Dimensional Novella
coverStyle: annular-threshold
openingStyle: paper-sigil
openingEyebrow: Opening Page
openingLabel: Spec-Driven Edition
openingQuote: In machine learning, the emptiness of high-dimensional spheres confuses our algorithms. In physics, that same emptiness helps stabilize conservation laws and helps explain why life needs a universe close to three spatial dimensions.
openingNote: Adrian enters a realm where nearness lies, continuity becomes currency, and finitude reveals itself as a form of mercy.
coverLogline: Displaced into a five-dimensional realm, Adrian Vale accepts the guidance of an elegant intelligence before learning it wants to harvest the one human constant that can stabilize its world.
bgStart: #0d1f2d
bgMid: #1c3e43
bgEnd: #834c2d
glowColor: #d9f2e8
foilColor: #f6e7c9
accentColor: #76c0b1
paperColor: #f7f0e3
paperEdge: #d4c5ae
inkColor: #1b1512
mutedColor: #625648
---

# Book Design

This file controls the visible book-facing SVG assets used by the demo viewer. The goal is not literal illustration. The goal is abstract, legible, atmospheric design.

## Cover Direction

- Keep the cover abstract.
- Use nested rings, threshold lines, basin-like glows, and restrained dust rather than characters or literal scenes.
- The cover should feel like a physical speculative-fiction edition, not a website hero card.
- Title, subtitle, author, and badge belong inside the generated cover-page SVG rather than as HTML overlays.

## Opening Page Direction

- The opening page should feel like an interior title/frontispiece leaf.
- Use a paper-toned background with a smaller abstract sigil rather than a second heavy cover treatment.
- Keep the quote and opening note calm, balanced, and bookish.

## Asset Contract

The build should generate separate SVG files:

- `cover-art.svg` for the abstract motif alone,
- `cover-page.svg` for the fully typeset cover,
- `opening-page.svg` for the first interior page.

All display text for these assets should come from this file.
