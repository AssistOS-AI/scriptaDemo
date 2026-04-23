import fs from "node:fs/promises";
import path from "node:path";

import { buildFrontmatter, titleFromSlug, writeIfMissing } from "./lib/book-core.mjs";
import { buildStoryCoreMarkdown, buildStoryCoreProfile, createSeed } from "./lib/story-core-library.mjs";

function parseArgs(argv) {
  const options = {
    chapterCount: 6,
    subtitle: "Add subtitle here",
    author: "Add author here",
    genre: "",
    tone: "",
    logline: "Add logline here",
    premise: "",
    seed: "",
  };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    const rawKey = arg.slice(2);
    const key =
      rawKey === "chapter-count"
        ? "chapterCount"
        : rawKey === "story-seed"
          ? "seed"
          : rawKey;
    const value = argv[index + 1];
    if (value == null || value.startsWith("--")) {
      options[key] = true;
      continue;
    }

    options[key] = value;
    index += 1;
  }

  return { options, positional };
}

function buildMetadataContent({ title, slug, profile, options }) {
  return `${buildFrontmatter({
    title,
    subtitle: options.subtitle,
    slug,
    author: options.author,
    genre: options.genre || "Add genre here",
    tone: options.tone || "Add tone here",
    logline: options.logline,
    storySeed: profile.seed,
    storyPatternId: profile.storyPattern.id,
    narrativeStructureId: profile.narrativeStructure.id,
    pacingProfileId: profile.pacingProfile.id,
    chapterOrder: profile.chapterBlueprints.map((chapter) => chapter.id),
  })}

# Metadata

## Book Identity

- Title: ${title}
- Subtitle: ${options.subtitle}
- Author: ${options.author}
- Genre: ${options.genre || "Refine from the user's prompt."}
- Tone: ${options.tone || "Refine from the user's prompt."}
- Logline: ${options.logline}

## Generation Contract

- Treat \`storySeed\` as the deterministic seed for the seeded catalog picks.
- \`chapterOrder\` is authoritative for build and chapter-generation passes.
- The selected story pattern, narrative structure, and pacing profile are defaults, not cages.
- Override seeded choices only when the user explicitly asks for something narrower or when consistency demands it.
`;
}

function buildBookPlanContent({ title, profile, options }) {
  return `# ${title} Book Plan

## Premise

${options.premise || "Refine the premise from the user's request. Keep the premise actionable: protagonist, pressure, world rule, and promise."}

## Story Core Contract

- Story pattern: **${profile.storyPattern.name}**
- Narrative structure: **${profile.narrativeStructure.name}**
- Pacing profile: **${profile.pacingProfile.name}**
- Wisdom strain: **${profile.wisdom.name}**
- Governing question: ${profile.storyPattern.question}
- Pressure note: ${profile.storyPattern.pressure}

## Thematic Thesis

${profile.selectedThemes.map((theme) => `- **${theme.name}**: ${theme.thesis}`).join("\n")}

## Character System

${profile.characters
  .map(
    (character) =>
      `- **${character.title}** uses **${character.archetype.name}**. Role: ${character.summary} Drive: ${character.archetype.drive}`
  )
  .join("\n")}

## World Building Contract

${profile.selectedWorldDrivers.map((driver) => `- **${driver.name}**: ${driver.effect}`).join("\n")}

## Plot Engine

${profile.selectedPlotElements.map((element) => `- **${element.name}**: ${element.job}`).join("\n")}

## Special Object Pressure

${profile.selectedObjects.map((item) => `- **${item.name}**: ${item.significance}`).join("\n")}

## Chapter Arc

${profile.chapterBlueprints
  .map(
    (chapter, index) =>
      `${index + 1}. **${chapter.title}**: ${chapter.phase.purpose} Event focus: ${chapter.event.name}. Chapter pressure: ${chapter.phase.pressure}`
  )
  .join("\n")}

## Specification Coverage

- \`story-core.md\` captures seeded theory picks and should remain the main randomness contract.
- \`characters/\`, \`relationships/\`, and \`evolution/\` track motive, pressure, and change.
- \`places/\`, \`world-building/\`, \`concepts/\`, and \`wisdom/\` establish the operating world.
- \`plot-elements/\`, \`special-objects/\`, and \`events/\` define reusable dramatic material.
- \`story-patterns/\`, \`narrative-structures/\`, and \`themes/\` keep high-level literary guidance explicit.

## Quality Bar

- Prefer strong, specific, and somewhat surprising combinations over default-safe genre moves.
- Use the seeded profile to avoid falling into generic archetype/theme combinations.
- The later chapter-builder pass should expand each chapter into scenes, roles, blocks, and dialogue goals before drafting prose.
- The later chapter-generator pass should validate drafts against this plan and retry when consistency breaks.
`;
}

function buildBookDesignContent({ title, profile, options }) {
  const primaryTheme = profile.selectedThemes[0];
  const secondaryTheme = profile.selectedThemes[1];
  const coverBadge = profile.storyPattern.name;
  const coverLogline = options.logline === "Add logline here" ? primaryTheme.thesis : options.logline;

  return `${buildFrontmatter({
    title: "Book Design",
    displayTitle: title,
    displaySubtitle: options.subtitle,
    displayAuthor: options.author,
    displayGenre: options.genre || "Speculative Book",
    displayTone: options.tone || "Precise, vivid, high-concept",
    coverBadge,
    coverStyle: profile.storyPattern.id === "pilgrimage-of-return" ? "folded-shore" : "annular-threshold",
    openingStyle: "paper-sigil",
    openingEyebrow: "Opening Page",
    openingLabel: profile.narrativeStructure.name,
    openingQuote: primaryTheme.thesis,
    openingNote: secondaryTheme ? secondaryTheme.thesis : profile.wisdom.principle,
    coverLogline,
    bgStart: "#102827",
    bgMid: "#173b39",
    bgEnd: "#8d4a27",
    glowColor: "#d8f2ea",
    foilColor: "#f7ead0",
    accentColor: "#67b5ab",
    paperColor: "#f7f0e4",
    paperEdge: "#d6c6af",
    inkColor: "#1d1814",
    mutedColor: "#65584c",
  })}

# Book Design

## Purpose

Use this file as the display-facing source for cover/opening copy, palette, and abstract motif direction.

## Text Contract

- Cover badge should stay short enough to typeset.
- Opening quote should express the book's strongest thesis in page-facing language.
- Opening note can extend the thesis, but it should still read like designed copy, not synopsis.

## Visual Direction

- Base the abstract forms on **${profile.storyPattern.name}** and **${profile.narrativeStructure.name}**.
- Let the palette feel consistent with **${primaryTheme.name}** and the world-building drivers.
- Favor abstract motifs over literal illustration unless the user explicitly requests otherwise.
- Design for three outputs: \`cover-art.svg\`, \`cover-page.svg\`, and \`opening-page.svg\`.
`;
}

function buildCharacterContent(character, profile) {
  return `# ${character.title}

## Narrative Job

${character.summary}

## Archetype

- Archetype: **${character.archetype.name}**
- Drive: ${character.archetype.drive}
- Gift: ${character.archetype.gift}
- Shadow: ${character.archetype.shadow}

## External Goal

State what this character wants in concrete, visible terms.

## Inner Need

State what this character must understand, admit, or relinquish.

## Pressure Points

- What this character fears losing.
- What kind of argument tempts them.
- What kind of relationship exposes their contradiction.

## Voice And Dialogue

- Vocabulary register:
- Rhythm of speech:
- What they avoid saying directly:

## Evolution

Anchor this character to the global evolution plan in \`specs/evolution/character-evolution.md\`.

## Consistency Anchors

- Keep this character legible inside the theme stack: ${profile.selectedThemes.map((theme) => theme.name).join(", ")}.
- Use this character to pressure the book's wisdom strain: ${profile.wisdom.principle}
`;
}

function buildArchetypeMatrixContent(profile) {
  return `# Archetype Matrix

## Selected Constellation

${profile.characters
  .map(
    (character) =>
      `- **${character.title}** -> **${character.archetype.name}**: Drive: ${character.archetype.drive} Gift: ${character.archetype.gift} Shadow: ${character.archetype.shadow}`
  )
  .join("\n")}

## Usage Rules

- Do not flatten archetypes into labels; each must create dramatic behavior.
- Keep the gift and shadow active in scene design.
- If the user supplies explicit character instructions, preserve those and use archetype language as a pressure lens rather than a replacement.
`;
}

function buildEvolutionContent(profile) {
  return `# Character Evolution

## Global Evolution Thesis

The protagonist should end the book with a different relationship to order, responsibility, and truth than at the opening.

## Role-Based Tracks

${profile.characters
  .map(
    (character) =>
      `- **${character.title}**: Opening posture shaped by ${character.archetype.name}. Midpoint pressure should expose the archetype's shadow. Ending should either transform or fully reveal that shadow.`
  )
  .join("\n")}

## Structural Check

- Chapter 1 should establish each major role's usable mask.
- Middle chapters should turn that mask into a liability or strategic advantage.
- Final chapters should force each major role into a choice that proves what they actually serve.
`;
}

function buildPlaceContent(place, profile) {
  return `# ${place.title}

## Narrative Role

${place.role}

## Sensory Logic

Describe what this place feels like to enter, navigate, and survive.

## World Building Hooks

${profile.selectedWorldDrivers.map((driver) => `- ${driver.name}: ${driver.effect}`).join("\n")}

## Scene Use

- What kind of scene belongs here.
- What kind of pressure intensifies here.
- What changes once a character returns here later in the story.
`;
}

function buildWisdomContent(profile) {
  return `# Guiding Wisdom

## Primary Wisdom Strain

- Wisdom strain: **${profile.wisdom.name}**
- Principle: ${profile.wisdom.principle}

## Usage

- Let this principle sharpen choices rather than sit as abstract commentary.
- The best moments should stage this wisdom against one of the selected themes.
- If the book becomes only strategic or only lyrical, use this file to rebalance it.
`;
}

function buildWorldBuildingContent(profile) {
  return `# World Rules

## Structural Drivers

${profile.selectedWorldDrivers.map((driver) => `- **${driver.name}**: ${driver.effect}`).join("\n")}

## Questions To Answer

- What remains scarce, unstable, or politically contested?
- What institutions or environmental rules enforce behavior?
- What crossings, translations, or thresholds change meaning?
- What kind of failure becomes catastrophic in this world?

## Consistency Rules

- World rules must constrain plot, not only decorate it.
- If a later draft introduces a new exception, write it down here and make the cost explicit.
`;
}

function buildPlotElementContent(element) {
  return `# ${element.name}

## Dramatic Job

${element.job}

## Use Cases

- Opening use:
- Middle-chapter complication:
- Late payoff or reinterpretation:

## Warning

Do not let this become a decorative trope. It must change leverage, trust, or the map of possible actions.
`;
}

function buildSpecialObjectContent(item) {
  return `# ${item.name}

## Significance

${item.significance}

## Object Logic

- Who believes this object matters.
- Why that belief is correct, incomplete, or manipulated.
- What changes when the object moves hands.

## Payoff

The object must alter a decision, a legitimacy claim, or a survival calculation.
`;
}

function buildEventContent(chapter, index) {
  return `# ${chapter.event.name}

## Event Function

${chapter.event.dramaticUse}

## Chapter Placement

- Primary chapter: ${index + 1}. ${chapter.title}
- Phase: ${chapter.phase.title}

## Required Outcome

Name what must be different in the story once this event has happened.
`;
}

function buildConceptContent(concept, profile) {
  return `# ${concept.title}

## Narrative Function

${concept.role}

## Connection To Story Core

- Story pattern: ${profile.storyPattern.name}
- Narrative structure: ${profile.narrativeStructure.name}
- Theme pressure: ${profile.selectedThemes.map((theme) => theme.name).join(", ")}

## Clarify

- Working definition:
- Why it matters to characters:
- What happens if it is misunderstood:
`;
}

function buildRelationshipContent(relationship) {
  return `# ${relationship.title}

## Dynamic

- Dynamic: **${relationship.dynamic.name}**
- Premise: ${relationship.dynamic.premise}
- Escalation: ${relationship.dynamic.escalation}

## Scene Use

- What this relationship looks like in calm conditions.
- What it looks like under pressure.
- What betrayal, clarity, or reconciliation would look like.
`;
}

function buildStoryPatternContent(profile) {
  return `# Core Story Pattern

## Pattern

- Pattern: **${profile.storyPattern.name}**
- Governing question: ${profile.storyPattern.question}
- Pressure note: ${profile.storyPattern.pressure}

## Use

- Keep this pattern visible in scene design and turning points.
- If later chapters drift into unrelated episodic material, use this file to pull them back into the book's governing question.
`;
}

function buildNarrativeStructureContent(profile) {
  return `# Core Narrative Structure

## Structure

- Structure: **${profile.narrativeStructure.name}**
- Shape: ${profile.narrativeStructure.shape}
- Best fit: ${profile.narrativeStructure.bestFor}

## Chapter Rhythm

${profile.chapterBlueprints
  .map(
    (chapter, index) =>
      `${index + 1}. **${chapter.title}** -> scenes: ${chapter.sceneCount}, blocks: ${chapter.blockCount}, phase: ${chapter.phase.title}`
  )
  .join("\n")}
`;
}

function buildThemeContent(theme, profile) {
  return `# ${theme.name}

## Thesis

${theme.thesis}

## Story Use

- Which scenes or relationships should make this theme concrete.
- Which counterargument should challenge it.
- How it interacts with the wisdom strain: ${profile.wisdom.name}
`;
}

function buildEmotionContent(profile) {
  return `# Character Emotional Arcs

## Emotional Spine

- Opening emotion: uncertainty under pressure.
- Midpoint emotion: sharpened attachment mixed with distrust.
- Late-book emotion: clarity that costs comfort.
- Ending emotion: transformed commitment rather than simple relief.

## Role Reminders

${profile.characters
  .map((character) => `- **${character.title}** should experience pressure through the lens of ${character.archetype.name}.`)
  .join("\n")}
`;
}

function buildChapterPlanContent({ profile, chapter, index }) {
  const themeA = profile.selectedThemes[index % profile.selectedThemes.length];
  const themeB = profile.selectedThemes[(index + 1) % profile.selectedThemes.length];
  const dependsOn = [
    "story-core.md",
    "book-plan.md",
    "book-design.md",
    "archetypes/role-matrix.md",
    "evolution/character-evolution.md",
    "emotions/character-emotional-arcs.md",
    "wisdom/guiding-wisdom.md",
    "world-building/world-rules.md",
    "story-patterns/core-story-pattern.md",
    "narrative-structures/core-narrative-structure.md",
    `themes/${themeA.id}.md`,
    `themes/${themeB.id}.md`,
    `plot-elements/${chapter.plotElement.id}.md`,
    ...chapter.requiredCharacters.map((item) => `characters/${item}.md`),
    ...chapter.requiredPlaces.map((item) => `places/${item}.md`),
    ...chapter.requiredConcepts.map((item) => `concepts/${item}.md`),
    ...chapter.requiredRelationships.map((item) => `relationships/${item}.md`),
    ...chapter.requiredEvents.map((item) => `events/${item}.md`),
    ...chapter.requiredObjects.map((item) => `special-objects/${item}.md`),
  ];

  return `${buildFrontmatter({
    id: chapter.id,
    title: chapter.title,
    summary: chapter.summary,
    phase: chapter.phase.id,
    storyPatternId: profile.storyPattern.id,
    narrativeStructureId: profile.narrativeStructure.id,
    pacingProfileId: profile.pacingProfile.id,
    sceneCount: chapter.sceneCount,
    blockCount: chapter.blockCount,
    dependsOn,
    requiredCharacters: chapter.requiredCharacters,
    requiredPlaces: chapter.requiredPlaces,
    requiredConcepts: chapter.requiredConcepts,
    requiredRelationships: chapter.requiredRelationships,
    requiredEvents: chapter.requiredEvents,
    requiredObjects: chapter.requiredObjects,
    requiredPlotElements: [chapter.plotElement.id],
    dialogueModes: chapter.dialogueModes,
  })}

# Chapter Plan

## Purpose

${chapter.phase.purpose}

## Core Tension

${chapter.phase.pressure}

## Story Function

- Event focus: **${chapter.event.name}**
- Plot element: **${chapter.plotElement.name}**
- Spotlight object: **${chapter.spotlightObject.name}**
- Theme pressure: **${themeA.name}** and **${themeB.name}**
- Chapter target: ${chapter.sceneCount} scenes and ${chapter.blockCount} blocks

## Scene Blueprint

Run \`node tools/chapter-builder.mjs docs/${profile.slug} ${chapter.id}\` to expand scene-by-scene structure before drafting.

## Character Roles

The chapter-builder pass should define which role each required character plays in this chapter.

## Block Set

The chapter-builder pass should decide the exact block cadence based on seeded rhythm and chapter pressure.

## Dialogue Set

Use dialogue modes: ${chapter.dialogueModes.join(", ")}.

## Consistency Checklist

- Mention or stage the required characters, places, concepts, relationships, events, and objects.
- Keep the chapter loyal to the book's story pattern and narrative structure.
- Do not let exposition replace scene work.
- End with a changed leverage state, not a decorative flourish.

## Generated Draft

# ${chapter.title}

Write the chapter draft here after scene/block planning is complete.
`;
}

async function main() {
  const { options, positional } = parseArgs(process.argv.slice(2));
  const slug = positional[0];
  const title = positional.slice(1).join(" ").trim() || titleFromSlug(slug || "");

  if (!slug) {
    console.error("Usage: node tools/book-init.mjs <book-slug> [Book Title] [--chapterCount 6] [--premise \"...\"]");
    process.exit(1);
  }

  const chapterCount = Number(options.chapterCount || 6);
  const seed = options.seed || createSeed();
  const profile = buildStoryCoreProfile({
    seed,
    title,
    slug,
    chapterCount,
    genre: options.genre || "",
    tone: options.tone || "",
    premise: options.premise || "",
  });

  const bookDir = path.resolve(process.cwd(), "docs", slug);
  const specsDir = path.join(bookDir, "specs");

  const files = [
    [path.join(specsDir, "metadata.md"), buildMetadataContent({ title, slug, profile, options })],
    [path.join(specsDir, "story-core.md"), `${buildFrontmatter({
      title: "Story Core",
      seed: profile.seed,
      storyPatternId: profile.storyPattern.id,
      narrativeStructureId: profile.narrativeStructure.id,
      pacingProfileId: profile.pacingProfile.id,
      wisdomId: profile.wisdom.id,
      themeIds: profile.selectedThemes.map((theme) => theme.id),
      archetypeIds: profile.selectedArchetypes.map((item) => item.id),
      relationIds: profile.selectedRelations.map((item) => item.id),
      plotElementIds: profile.selectedPlotElements.map((item) => item.id),
      specialObjectIds: profile.selectedObjects.map((item) => item.id),
      eventIds: profile.selectedEvents.slice(0, profile.chapterCount).map((item) => item.id),
    })}\n${buildStoryCoreMarkdown(profile)}`],
    [path.join(specsDir, "book-plan.md"), buildBookPlanContent({ title, profile, options })],
    [path.join(specsDir, "book-design.md"), buildBookDesignContent({ title, profile, options })],
    [path.join(specsDir, "archetypes", "role-matrix.md"), buildArchetypeMatrixContent(profile)],
    [path.join(specsDir, "evolution", "character-evolution.md"), buildEvolutionContent(profile)],
    [path.join(specsDir, "wisdom", "guiding-wisdom.md"), buildWisdomContent(profile)],
    [path.join(specsDir, "world-building", "world-rules.md"), buildWorldBuildingContent(profile)],
    [path.join(specsDir, "story-patterns", "core-story-pattern.md"), buildStoryPatternContent(profile)],
    [path.join(specsDir, "narrative-structures", "core-narrative-structure.md"), buildNarrativeStructureContent(profile)],
    [path.join(specsDir, "emotions", "character-emotional-arcs.md"), buildEmotionContent(profile)],
  ];

  for (const character of profile.characters) {
    files.push([path.join(specsDir, "characters", `${character.file}.md`), buildCharacterContent(character, profile)]);
  }

  for (const place of profile.places) {
    files.push([path.join(specsDir, "places", `${place.id}.md`), buildPlaceContent(place, profile)]);
  }

  for (const concept of profile.conceptSeeds) {
    files.push([path.join(specsDir, "concepts", `${concept.id}.md`), buildConceptContent(concept, profile)]);
  }

  for (const relationship of profile.relationshipSeeds) {
    files.push([path.join(specsDir, "relationships", `${relationship.id}.md`), buildRelationshipContent(relationship)]);
  }

  for (const element of profile.selectedPlotElements) {
    files.push([path.join(specsDir, "plot-elements", `${element.id}.md`), buildPlotElementContent(element)]);
  }

  for (const item of profile.selectedObjects) {
    files.push([path.join(specsDir, "special-objects", `${item.id}.md`), buildSpecialObjectContent(item)]);
  }

  const uniqueEvents = new Map();
  for (let index = 0; index < profile.chapterBlueprints.length; index += 1) {
    const chapter = profile.chapterBlueprints[index];
    if (!uniqueEvents.has(chapter.event.id)) {
      uniqueEvents.set(chapter.event.id, [chapter, index]);
    }
  }

  for (const [eventId, [chapter, index]] of uniqueEvents.entries()) {
    void eventId;
    files.push([path.join(specsDir, "events", `${chapter.event.id}.md`), buildEventContent(chapter, index)]);
  }

  for (const theme of profile.selectedThemes) {
    files.push([path.join(specsDir, "themes", `${theme.id}.md`), buildThemeContent(theme, profile)]);
  }

  for (let index = 0; index < profile.chapterBlueprints.length; index += 1) {
    const chapter = profile.chapterBlueprints[index];
    files.push([path.join(specsDir, "chapter-plans", `${chapter.id}.md`), buildChapterPlanContent({ profile, chapter, index })]);
  }

  const results = [];
  for (const [filePath, content] of files) {
    results.push(`${path.relative(process.cwd(), filePath)}: ${await writeIfMissing(filePath, content)}`);
  }

  await fs.mkdir(path.join(bookDir, "chapters"), { recursive: true });
  await fs.mkdir(path.join(bookDir, "build"), { recursive: true });

  console.log(`Initialized docs/${slug}`);
  console.log(`Seed: ${profile.seed}`);
  console.log(`Story pattern: ${profile.storyPattern.name}`);
  console.log(`Narrative structure: ${profile.narrativeStructure.name}`);
  console.log(`Pacing profile: ${profile.pacingProfile.name}`);
  for (const result of results) {
    console.log(result);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
