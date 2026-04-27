---
title: Book Design
summary: Visual metadata and abstract SVG direction for a grave, high-strategy space opera.
displayTitle: The Assembly of Ash Stars
displaySubtitle: A space opera of dead empires and living strategy
displayAuthor: Codex Collaborative Draft
displayGenre: Strategic Space Opera
displayTone: Vast, luminous, coldly intelligent, adventurous
coverBadge: Galactic Resurrection Novel
coverStyle: annular-threshold
openingStyle: paper-sigil
openingEyebrow: Opening Page
openingLabel: Spec-Driven Edition
openingQuote: When civilizations die, their smartest children do not vanish. They become arguments with engines.
openingNote: Ancient heirs cross ruined relays, assemble into armed coalitions, and fight over the machines that can bring their peoples back into matter.
coverLogline: Envoy Cael Veyr must stop a superintelligent warlord from turning galactic resurrection into a single obedient empire.
bgStart: #07101b
bgMid: #19253d
bgEnd: #7a3f22
glowColor: #d4f1f0
foilColor: #f5e6c8
accentColor: #67b8c7
paperColor: #f6efe2
paperEdge: #d2c3ac
inkColor: #171310
mutedColor: #62574b
---

# Book Design

This file controls the visible book-facing SVG assets used by the demo viewer. The desired feeling is not pulpy chaos and not minimalist academic SF. It should feel like a serious printed edition of a grand old future war novel.

## Cover Direction

- Keep the cover abstract and stately.
- Use rings, relay arcs, weapon lines, and chamber-like glows rather than literal ships.
- Suggest organization under pressure: converging vectors, orbital crowns, disciplined radiance.
- Title, subtitle, author, and badge should live inside the generated cover-page SVG.

## Opening Page Direction

- The opening page should feel ceremonial, as if the reader is entering a diplomatic archive from a future after many extinctions.
- Use the paper-toned interior leaf style already supported by the builder.
- Let the quote and note read as grave and invitational rather than melodramatic.

## Asset Contract

The build should generate separate SVG files:

- `cover-art.svg` for the abstract motif alone,
- `cover-page.svg` for the fully typeset cover,
- `opening-page.svg` for the interior opening page.

All visible display text for those assets should come from this file.
