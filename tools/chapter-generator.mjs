import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  countWords,
  extractGeneratedDraft,
  extractSummary,
  fileExists,
  normalizeForSearch,
  parseFrontmatter,
  readFile,
} from "./lib/book-core.mjs";

function parseArgs(argv) {
  const options = {
    validate: false,
    json: false,
  };
  const positional = [];

  for (const arg of argv) {
    if (arg === "--validate") {
      options.validate = true;
      continue;
    }

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    positional.push(arg);
  }

  return { options, positional };
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSection(body, heading) {
  const pattern = new RegExp(`(?:^|\\n)## ${escapeRegex(heading)}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, "m");
  const match = String(body || "").match(pattern);
  return match ? match[1].trim() : "";
}

async function loadSpecEntry(specsDir, groupName, id) {
  const relativePath = `${groupName}/${id}.md`;
  const raw = await readFile(path.join(specsDir, relativePath));
  const { body } = parseFrontmatter(raw);
  const title = body.match(/^#\s+(.+)$/m)?.[1]?.trim() || id;
  const summary = extractSummary(body);
  return { id, groupName, relativePath, title, summary };
}

function buildSearchTerms(entry) {
  const pathTerms = entry.id.split("-").filter((part) => part.length > 2);
  const titleTerms = entry.title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((part) => part.length > 2);

  const phrases = [entry.title, entry.id.replace(/-/g, " ")].filter(Boolean);
  return {
    phrases: phrases.map((item) => normalizeForSearch(item)).filter(Boolean),
    keywords: [...new Set([...pathTerms, ...titleTerms])],
  };
}

function paragraphCount(text) {
  return String(text || "")
    .split(/\n\s*\n/g)
    .map((chunk) => chunk.trim())
    .filter(Boolean).length;
}

function countDialogueSignals(text) {
  const matches = String(text || "").match(/["“”]|^[-:]/gm);
  return matches ? matches.length : 0;
}

function entityAppearsInDraft(entry, draft) {
  const normalizedDraft = normalizeForSearch(draft);
  const { phrases, keywords } = buildSearchTerms(entry);

  if (phrases.some((phrase) => phrase && normalizedDraft.includes(phrase))) {
    return true;
  }

  const keywordHits = keywords.filter((keyword) => normalizedDraft.includes(keyword));
  return keywordHits.length >= Math.min(2, keywords.length);
}

export async function buildChapterContext(bookDir, chapterId) {
  const specsDir = path.join(bookDir, "specs");
  const metadataPath = path.join(specsDir, "metadata.md");
  const storyCorePath = path.join(specsDir, "story-core.md");
  const bookPlanPath = path.join(specsDir, "book-plan.md");
  const planPath = path.join(specsDir, "chapter-plans", `${chapterId}.md`);

  const metadataRaw = await readFile(metadataPath);
  const bookPlanRaw = await readFile(bookPlanPath);
  const planRaw = await readFile(planPath);
  const storyCoreRaw = (await fileExists(storyCorePath)) ? await readFile(storyCorePath) : "";

  const { data: metadata } = parseFrontmatter(metadataRaw);
  const { data: storyCoreData, body: storyCoreBody } = parseFrontmatter(storyCoreRaw);
  const { body: bookPlanBody } = parseFrontmatter(bookPlanRaw);
  const { data: planMeta, body: planBody } = parseFrontmatter(planRaw);

  const requiredCharacters = await Promise.all((planMeta.requiredCharacters || []).map((id) => loadSpecEntry(specsDir, "characters", id)));
  const requiredPlaces = await Promise.all((planMeta.requiredPlaces || []).map((id) => loadSpecEntry(specsDir, "places", id)));
  const requiredConcepts = await Promise.all((planMeta.requiredConcepts || []).map((id) => loadSpecEntry(specsDir, "concepts", id)));
  const requiredRelationships = await Promise.all(
    (planMeta.requiredRelationships || []).map((id) => loadSpecEntry(specsDir, "relationships", id))
  );
  const requiredEvents = await Promise.all((planMeta.requiredEvents || []).map((id) => loadSpecEntry(specsDir, "events", id)));
  const requiredObjects = await Promise.all((planMeta.requiredObjects || []).map((id) => loadSpecEntry(specsDir, "special-objects", id)));
  const requiredPlotElements = await Promise.all(
    (planMeta.requiredPlotElements || []).map((id) => loadSpecEntry(specsDir, "plot-elements", id))
  );

  const sceneBlueprint = extractSection(planBody, "Scene Blueprint");
  const characterRoles = extractSection(planBody, "Character Roles");
  const blockSet = extractSection(planBody, "Block Set");
  const dialogueSet = extractSection(planBody, "Dialogue Set");
  const consistencyChecklist = extractSection(planBody, "Consistency Checklist");
  const generatedDraft = extractGeneratedDraft(planBody);

  return {
    bookDir,
    chapterId,
    metadata,
    storyCore: {
      data: storyCoreData,
      summary: extractSummary(storyCoreBody),
    },
    bookPlan: {
      summary: extractSummary(bookPlanBody),
    },
    planMeta,
    sections: {
      sceneBlueprint,
      characterRoles,
      blockSet,
      dialogueSet,
      consistencyChecklist,
    },
    required: {
      characters: requiredCharacters,
      places: requiredPlaces,
      concepts: requiredConcepts,
      relationships: requiredRelationships,
      events: requiredEvents,
      objects: requiredObjects,
      plotElements: requiredPlotElements,
    },
    generatedDraft,
  };
}

export function validateChapterContext(context) {
  const errors = [];
  const warnings = [];
  const draft = context.generatedDraft;
  const wordCount = countWords(draft);
  const paragraphs = paragraphCount(draft);
  const dialogueSignals = countDialogueSignals(draft);
  const targetWordCount = Math.max(1200, Number(context.planMeta.blockCount || 5) * 220);

  if (!context.sections.sceneBlueprint) {
    errors.push("Missing `## Scene Blueprint` content. Run chapter-builder before drafting.");
  }

  if (!context.sections.characterRoles) {
    errors.push("Missing `## Character Roles` content. Run chapter-builder before drafting.");
  }

  if (!context.sections.blockSet) {
    errors.push("Missing `## Block Set` content. Run chapter-builder before drafting.");
  }

  if (!context.sections.dialogueSet) {
    errors.push("Missing `## Dialogue Set` content. Run chapter-builder before drafting.");
  }

  if (!context.sections.consistencyChecklist) {
    errors.push("Missing `## Consistency Checklist` content.");
  }

  if (/write the chapter draft here/i.test(draft) || /#\s+draft title/i.test(draft)) {
    errors.push("Generated draft still contains scaffold placeholder text.");
  }

  if (wordCount < targetWordCount) {
    errors.push(`Draft is too thin: ${wordCount} words, target at least ${targetWordCount}.`);
  }

  if (paragraphs < Math.max(3, Number(context.planMeta.sceneCount || 4) - 1)) {
    warnings.push(`Draft has only ${paragraphs} paragraphs; scene coverage may be too compressed.`);
  }

  if ((context.planMeta.dialogueModes || []).length && dialogueSignals < 2) {
    warnings.push("Dialogue signals are sparse relative to the planned dialogue set.");
  }

  if (!normalizeForSearch(draft).includes(normalizeForSearch(context.planMeta.title || ""))) {
    warnings.push("Chapter draft heading or title string does not obviously match the chapter title.");
  }

  for (const entry of context.required.characters) {
    if (!entityAppearsInDraft(entry, draft)) {
      errors.push(`Required character not clearly present in draft: ${entry.title}.`);
    }
  }

  for (const entry of context.required.places) {
    if (!entityAppearsInDraft(entry, draft)) {
      errors.push(`Required place not clearly present in draft: ${entry.title}.`);
    }
  }

  for (const entry of context.required.concepts) {
    if (!entityAppearsInDraft(entry, draft)) {
      errors.push(`Required concept not clearly surfaced in draft: ${entry.title}.`);
    }
  }

  for (const entry of context.required.relationships) {
    if (!entityAppearsInDraft(entry, draft)) {
      warnings.push(`Relationship file not clearly echoed in draft language: ${entry.title}.`);
    }
  }

  for (const entry of context.required.events) {
    if (!entityAppearsInDraft(entry, draft)) {
      errors.push(`Required event not clearly staged in draft: ${entry.title}.`);
    }
  }

  for (const entry of context.required.objects) {
    if (!entityAppearsInDraft(entry, draft)) {
      warnings.push(`Required object not clearly visible in draft: ${entry.title}.`);
    }
  }

  for (const entry of context.required.plotElements || []) {
    if (!entityAppearsInDraft(entry, draft)) {
      warnings.push(`Planned plot element not clearly visible in draft language: ${entry.title}.`);
    }
  }

  return {
    status: errors.length ? "fail" : "pass",
    metrics: {
      words: wordCount,
      targetWords: targetWordCount,
      paragraphs,
      dialogueSignals,
      sceneTarget: Number(context.planMeta.sceneCount || 4),
      blockTarget: Number(context.planMeta.blockCount || 5),
    },
    errors,
    warnings,
  };
}

function buildGenerationPacket(context) {
  return {
    book: {
      title: context.metadata.title,
      genre: context.metadata.genre,
      tone: context.metadata.tone,
      logline: context.metadata.logline,
      storyPatternId: context.storyCore.data.storyPatternId,
      narrativeStructureId: context.storyCore.data.narrativeStructureId,
      pacingProfileId: context.storyCore.data.pacingProfileId,
    },
    chapter: {
      id: context.chapterId,
      title: context.planMeta.title,
      summary: context.planMeta.summary,
      phase: context.planMeta.phase,
      sceneCount: Number(context.planMeta.sceneCount || 4),
      blockCount: Number(context.planMeta.blockCount || 5),
      dialogueModes: context.planMeta.dialogueModes || [],
    },
    summaries: {
      storyCore: context.storyCore.summary,
      bookPlan: context.bookPlan.summary,
    },
    required: {
      characters: context.required.characters,
      places: context.required.places,
      concepts: context.required.concepts,
      relationships: context.required.relationships,
      events: context.required.events,
      objects: context.required.objects,
      plotElements: context.required.plotElements,
    },
    sectionInputs: context.sections,
    guidance: [
      "Generate all planned elements before composing prose.",
      "Compose directly into `## Generated Draft` in the chapter plan.",
      "Validate with `node tools/chapter-generator.mjs docs/<book-slug> <chapter-id> --validate`.",
      "If validation fails, revise and rerun until only acceptable warnings remain.",
    ],
  };
}

async function main() {
  const { options, positional } = parseArgs(process.argv.slice(2));
  const targetArg = positional[0];
  const chapterId = positional[1];

  if (!targetArg || !chapterId) {
    console.error("Usage: node tools/chapter-generator.mjs docs/<book-slug> <chapter-id> [--validate] [--json]");
    process.exit(1);
  }

  const bookDir = path.resolve(process.cwd(), targetArg);
  const context = await buildChapterContext(bookDir, chapterId);

  if (options.validate) {
    const report = validateChapterContext(context);
    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(`Validation status: ${report.status}`);
      console.log(`Words: ${report.metrics.words}/${report.metrics.targetWords}`);
      console.log(`Paragraphs: ${report.metrics.paragraphs}`);
      console.log(`Dialogue signals: ${report.metrics.dialogueSignals}`);
      for (const error of report.errors) {
        console.log(`ERROR: ${error}`);
      }
      for (const warning of report.warnings) {
        console.log(`WARNING: ${warning}`);
      }
    }

    process.exit(report.status === "pass" ? 0 : 1);
  }

  const packet = buildGenerationPacket(context);
  if (options.json) {
    console.log(JSON.stringify(packet, null, 2));
  } else {
    console.log(JSON.stringify(packet, null, 2));
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
const currentPath = fileURLToPath(import.meta.url);

if (invokedPath === currentPath) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
