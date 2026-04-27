---
name: chapter-generator
description: Generate or regenerate a chapter draft from the structured chapter plan, validate it against the Story Core and support specs, and retry until chapter-level consistency is acceptable.
---

# Chapter Generator

Use this skill when the user wants actual chapter prose, not only planning.

## Responsibilities

1. Gather the chapter generation packet from the current specs.
2. Generate all planned elements inside `## Generated Draft` in the chapter plan source file.
3. Validate the draft against the chapter plan and general specs.
4. If validation fails, revise the draft and rerun validation until it passes or only acceptable warnings remain.
5. Treat the chapter plan as authoritative. Do not manually treat `docs/BOOKNAME/chapters/*.md` as the source of truth.

## Commands

Get the generation packet:

```bash
node tools/chapter-generator.mjs docs/<book-slug> <chapter-id> --json
```

Validate the draft:

```bash
node tools/chapter-generator.mjs docs/<book-slug> <chapter-id> --validate
```

## Workflow

1. Run `chapter-builder` first if the chapter plan is not yet detailed enough.
2. Run `chapter-generator.mjs --json` and use the output as the drafting packet.
3. Write the prose into the chapter plan's `## Generated Draft`.
4. Run `chapter-generator.mjs --validate`.
5. If validation fails, revise and rerun. The retry loop is part of the skill, not an optional extra.
6. After the chapter passes, use `book-build` to extract and aggregate.

## Prose Quality Requirements

All generated chapter drafts must satisfy these narrative craft standards:

### Show, Don't Tell — The Central Rule
- **Never explain what a theme means when you can show a character experiencing it.**
  - BAD: "Oriveni civilization had always been built on the principle that no being ends another."
  - GOOD: "When the root-network trembled with Verath's protest — a deep, slow vibration that Aethon felt in every fiber of his trunk — the tremor carried a four-thousand-year certainty. No one kills. No one has ever killed. The network itself makes it impossible to hide, impossible to forget, impossible to pretend the harm wasn't yours."
- Replace every abstract noun in a thematic sentence with a concrete scene, a sensory detail, or a character's lived experience.
- If you catch yourself writing a paragraph that could appear in an encyclopedia or philosophy textbook, stop. Rewrite it as a scene where a character discovers or confronts that idea through action.

### Opening Paragraphs Must Hook
- The first sentence of every chapter must create immediate curiosity, tension, or sensory immersion.
- Never open with world-lore, exposition, a summary of the previous chapter, or an abstract statement.
- Preferred openers:
  - **Action in progress**: A character doing something that creates tension.
  - **Sensory shock**: A vivid, startling sensation that places the reader inside a body.
  - **Disrupted expectation**: Something happening that should not be happening.
  - **Charged dialogue mid-conversation**: Entering a conflict already underway.

### Every Scene Must Change Something
- A scene that only conveys information (world-building, backstory, theme) without changing a relationship, belief, power balance, or situation is not a scene — it is a lecture. Cut it or rebuild it.
- The end of each scene must leave the reader in a different emotional or informational position than the start.
- Ask of each scene: "If I remove this scene, does anything change in the story?" If the answer is no, the scene must go.

### Transitions Between Scenes
- When moving from one scene to the next, bridge with **causal or emotional logic**, not with "meanwhile" or chapter breaks that erase continuity.
- The last image or line of one scene should create a question that the next scene answers or complicates.
- Avoid jarring jumps from one subject to an unrelated subject. If two consecutive scenes are disconnected, either find the hidden connection or restructure.

### Dialogue Must Have Teeth
- Characters should not speak in thesis statements. If a character explains the theme, the dialogue is failing.
- Every line of dialogue should have two layers: what the character says, and what they actually mean (or are afraid to say).
- When characters argue, they should argue from their specific, personal stakes — not from abstract positions.
- Let characters sometimes be wrong, sometimes win arguments they should lose, sometimes say the right thing for the wrong reason.

### Context Before Conflict
- Before a character makes a difficult decision, the reader must understand **what they stand to lose personally**.
- Before a philosophical crisis erupts, the reader must care about the person experiencing it.
- Before world-lore becomes relevant, a character must need that knowledge in this specific moment for a concrete purpose.

### Sensory Texture
- Every chapter should engage at least three of these senses: the civilization's specific sensory palette (root-tremor, solar heat, fungal light, mineral taste, network hum).
- Avoid chapters that take place entirely in the abstract realm of ideas. Take the reader inside a body, a place, a temperature, a texture.

### Chapter Endings Must Pull Forward
- The final paragraph of every chapter must create an **unresolved tension** that compels the reader to continue.
- Acceptable endings: a revealed consequence, a new question, a decision not yet acted on, a sensation that promises change.
- Unacceptable endings: a clean summary of what the chapter was about, a philosophical reflection, a comfortable resolution.

## Validation Standard

- Required characters, places, concepts, events, and key objects must actually appear.
- The draft should meet the chapter's block and scene density expectations.
- Planned dialogue should leave visible traces in the prose.
- Placeholder scaffold text is never acceptable.
- If the user asked for a highly specific thematic or tonal result, verify that after the structural checks.
- The opening paragraph must be a hook (not exposition or world-lore).
- The closing paragraph must be a forward-pull (not a clean resolution).
- No paragraph should read like an encyclopedia entry or philosophy essay.