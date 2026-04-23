import path from "node:path";

import {
  extractSummary,
  parseFrontmatter,
  readFile,
  replaceOrAppendSection,
  titleFromSlug,
  writeIfChanged,
} from "./lib/book-core.mjs";

function parseArgs(argv) {
  const options = { all: false };
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--all") {
      options.all = true;
      continue;
    }

    positional.push(arg);
  }

  return { options, positional };
}

function phaseSceneFunctions(phase) {
  const defaults = {
    disturbance: ["destabilize the ordinary", "introduce the first usable guide or counterforce", "force the irreversible move"],
    terms: ["clarify the new rules", "bind the protagonist into a provisional alliance", "show the hidden price of cooperation"],
    expansion: ["widen the scale of conflict", "test information in a live environment", "turn local stakes into systemic stakes"],
    reversal: ["reinterpret earlier trust", "surface concealed leverage", "force a costly new reading of events"],
    crisis: ["stage the moral argument", "strip away comfortable alternatives", "create the narrow path that still preserves integrity"],
    settlement: ["prove change through action", "show what order now exists", "leave a residue of cost or ambiguity"],
  };

  return defaults[phase] || defaults.disturbance;
}

function blockTemplatesForPhase(phase) {
  const defaults = {
    disturbance: ["hook", "orientation", "friction", "threshold-crossing", "exit-vector"],
    terms: ["re-entry", "rule-exposure", "test", "bargain", "unstable-agreement", "pressure-tag"],
    expansion: ["objective", "search", "countermove", "evidence-shift", "complication", "pursuit"],
    reversal: ["confidence", "fracture", "accusation", "revealed-cost", "decision", "aftershock"],
    crisis: ["compression", "moral-test", "narrowing-options", "choice", "counterstrike", "consequence"],
    settlement: ["return", "public-proof", "settlement", "reckoning", "residue"],
  };

  return defaults[phase] || defaults.disturbance;
}

function readableLabel(text) {
  return String(text || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

async function loadSpecSummary(specsDir, relativePath) {
  const filePath = path.join(specsDir, relativePath);
  const raw = await readFile(filePath);
  const { body } = parseFrontmatter(raw);
  return {
    path: relativePath,
    title: body.match(/^#\s+(.+)$/m)?.[1]?.trim() || titleFromSlug(path.basename(relativePath, ".md")),
    summary: extractSummary(body),
  };
}

async function loadRoleEntries(specsDir, groupName, ids) {
  const entries = [];
  for (const id of ids || []) {
    const relativePath = `${groupName}/${id}.md`;
    entries.push({
      id,
      ...(await loadSpecSummary(specsDir, relativePath)),
    });
  }
  return entries;
}

function cyclePick(list, index) {
  return list[index % list.length];
}

function buildSceneBlueprint({ chapterMeta, characterEntries, placeEntries, conceptEntries, objectEntries, relationshipEntries }) {
  const sceneCount = Number(chapterMeta.sceneCount || 4);
  const functions = phaseSceneFunctions(chapterMeta.phase);
  const scenes = [];

  for (let index = 0; index < sceneCount; index += 1) {
    const location = cyclePick(placeEntries, index);
    const lead = cyclePick(characterEntries, index);
    const support = cyclePick(characterEntries, index + 1);
    const concept = cyclePick(conceptEntries, index);
    const object = cyclePick(objectEntries, index);
    const relationship = cyclePick(relationshipEntries, index);
    const functionLabel = cyclePick(functions, index);
    const closingShift = index === sceneCount - 1 ? "End the scene with changed leverage and a visible next pressure." : "Leave the scene with a narrower set of safe options.";

    scenes.push(`${index + 1}. **Scene ${index + 1}: ${readableLabel(functionLabel.replace(/\s+/g, "-"))}**
   - Function: ${functionLabel}.
   - Primary location: ${location ? `**${location.title}**` : "Choose the most pressure-bearing location available."}
   - Lead presence: ${lead ? `**${lead.title}**` : "Define the viewpoint role."}
   - Counter-pressure: ${support ? `**${support.title}**` : "Introduce a conflicting force."}
   - Concept pressure: ${concept ? `Bring **${concept.title}** into action, not only explanation.` : "Advance the core concept through action."}
   - Relationship stress: ${relationship ? `Test **${relationship.title}**.` : "Test the strongest live relationship."}
   - Object or symbol: ${object ? `Give **${object.title}** a concrete effect in the scene.` : "Use a recurring object or sign."}
   - Exit condition: ${closingShift}`);
  }

  return scenes.join("\n\n");
}

function buildCharacterRoles({ chapterMeta, characterEntries }) {
  const roleTemplates = {
    protagonist: "Drive the chapter's decisive move and own the chapter's changing interpretation.",
    counterpart: "Offer access, expertise, temptation, or relational resistance close to the protagonist.",
    "pressure-source": "Make delay dangerous and turn the chapter's pressure into a strategic or moral threat.",
    witness: "Name the cost others are tempted to treat as abstract.",
    catalyst: "Introduce the new fact, route, interruption, or trigger that changes the chapter's angle.",
  };

  return characterEntries
    .map((entry) => {
      const roleText = roleTemplates[entry.id] || "Define a precise dramatic function for this chapter.";
      const dialogueModes = (chapterMeta.dialogueModes || []).join(", ");
      return `- **${entry.title}**: ${roleText} Chapter dialogue should support: ${dialogueModes || "chapter-specific pressure talk"}.`;
    })
    .join("\n");
}

function buildBlockSet({ chapterMeta, characterEntries, placeEntries, conceptEntries }) {
  const blockCount = Number(chapterMeta.blockCount || 5);
  const blockLabels = blockTemplatesForPhase(chapterMeta.phase);
  const blocks = [];

  for (let index = 0; index < blockCount; index += 1) {
    const label = cyclePick(blockLabels, index);
    const focalCharacter = cyclePick(characterEntries, index);
    const focalPlace = cyclePick(placeEntries, index);
    const focalConcept = cyclePick(conceptEntries, index);
    const lengthTarget = index === 0 || index === blockCount - 1 ? "180-260 words" : "220-340 words";

    blocks.push(`${index + 1}. **${readableLabel(label)}**
   - Objective: Keep the prose moving while advancing a specific shift.
   - Focus: ${focalCharacter ? focalCharacter.title : "Choose the pressure-bearing viewpoint"} in ${focalPlace ? focalPlace.title : "the most consequential location"}.
   - Concept to surface: ${focalConcept ? focalConcept.title : "the chapter's governing concept"}.
   - Length target: ${lengthTarget}.
   - Pivot: End the block with new leverage, sharper uncertainty, or a revealed cost.`);
  }

  return blocks.join("\n\n");
}

function participantsForDialogue(characterEntries) {
  const first = characterEntries[0]?.title || "Primary character";
  const second = characterEntries[1]?.title || "Counterforce";
  const third = characterEntries[2]?.title || "Pressure source";
  return { first, second, third };
}

function buildDialogueSet({ chapterMeta, characterEntries, relationshipEntries, conceptEntries }) {
  const dialogueModes = chapterMeta.dialogueModes || ["strategic-disagreement"];
  const { first, second, third } = participantsForDialogue(characterEntries);

  return dialogueModes
    .map((mode, index) => {
      const relationship = relationshipEntries[index % relationshipEntries.length];
      const concept = conceptEntries[index % conceptEntries.length];
      const pairing = index === 0 ? `${first} and ${second}` : index === dialogueModes.length - 1 ? `${first} and ${third}` : `${second} and ${third}`;
      return `- **${readableLabel(mode)}** between **${pairing}**: let the exchange reveal leverage, not just information. ${
        relationship ? `Stress the dynamic from **${relationship.title}**.` : ""
      } ${concept ? `Tie at least one line of dialogue to **${concept.title}**.` : ""}`.trim();
    })
    .join("\n");
}

function buildConsistencyChecklist({ chapterMeta, characterEntries, placeEntries, conceptEntries, objectEntries, eventEntries }) {
  const sceneCount = Number(chapterMeta.sceneCount || 4);
  const blockCount = Number(chapterMeta.blockCount || 5);

  return [
    `- Deliver at least ${sceneCount} distinct scene movements and roughly ${blockCount} prose blocks or block-equivalents.`,
    `- Stage these characters explicitly: ${characterEntries.map((entry) => entry.title).join(", ")}.`,
    `- Use these locations or location-equivalents: ${placeEntries.map((entry) => entry.title).join(", ")}.`,
    `- Make these concepts actionable: ${conceptEntries.map((entry) => entry.title).join(", ")}.`,
    eventEntries.length ? `- The chapter must visibly contain the event pressure of: ${eventEntries.map((entry) => entry.title).join(", ")}.` : "- Make the key event legible in live action.",
    objectEntries.length ? `- Give these objects or symbolic anchors consequence: ${objectEntries.map((entry) => entry.title).join(", ")}.` : "- Keep one recurring object or symbol consequential.",
    "- End with a changed leverage state that pushes the next chapter open.",
  ].join("\n");
}

async function enrichChapterPlan(bookDir, chapterId) {
  const specsDir = path.join(bookDir, "specs");
  const planPath = path.join(specsDir, "chapter-plans", `${chapterId}.md`);
  const rawPlan = await readFile(planPath);
  const { data: chapterMeta, body: chapterBody } = parseFrontmatter(rawPlan);

  const characterEntries = await loadRoleEntries(specsDir, "characters", chapterMeta.requiredCharacters || []);
  const placeEntries = await loadRoleEntries(specsDir, "places", chapterMeta.requiredPlaces || []);
  const conceptEntries = await loadRoleEntries(specsDir, "concepts", chapterMeta.requiredConcepts || []);
  const relationshipEntries = await loadRoleEntries(specsDir, "relationships", chapterMeta.requiredRelationships || []);
  const eventEntries = await loadRoleEntries(specsDir, "events", chapterMeta.requiredEvents || []);
  const objectEntries = await loadRoleEntries(specsDir, "special-objects", chapterMeta.requiredObjects || []);

  let nextBody = chapterBody;
  nextBody = replaceOrAppendSection(
    nextBody,
    "Scene Blueprint",
    buildSceneBlueprint({ chapterMeta, characterEntries, placeEntries, conceptEntries, objectEntries, relationshipEntries })
  );
  nextBody = replaceOrAppendSection(nextBody, "Character Roles", buildCharacterRoles({ chapterMeta, characterEntries }));
  nextBody = replaceOrAppendSection(nextBody, "Block Set", buildBlockSet({ chapterMeta, characterEntries, placeEntries, conceptEntries }));
  nextBody = replaceOrAppendSection(
    nextBody,
    "Dialogue Set",
    buildDialogueSet({ chapterMeta, characterEntries, relationshipEntries, conceptEntries })
  );
  nextBody = replaceOrAppendSection(
    nextBody,
    "Consistency Checklist",
    buildConsistencyChecklist({ chapterMeta, characterEntries, placeEntries, conceptEntries, objectEntries, eventEntries })
  );

  const nextContent = `---\n${rawPlan.slice(4, rawPlan.indexOf("\n---\n", 4))}\n---\n${nextBody}`;
  return {
    chapterId,
    state: await writeIfChanged(planPath, nextContent),
  };
}

async function readChapterOrder(bookDir) {
  const metadataPath = path.join(bookDir, "specs", "metadata.md");
  const raw = await readFile(metadataPath);
  const { data } = parseFrontmatter(raw);
  return data.chapterOrder || [];
}

async function main() {
  const { options, positional } = parseArgs(process.argv.slice(2));
  const targetArg = positional[0];
  const requestedChapter = positional[1];

  if (!targetArg) {
    console.error("Usage: node tools/chapter-builder.mjs docs/<book-slug> <chapter-id> | --all");
    process.exit(1);
  }

  const bookDir = path.resolve(process.cwd(), targetArg);
  const chapterIds = options.all ? await readChapterOrder(bookDir) : [requestedChapter];

  if (!chapterIds[0]) {
    console.error("Provide a chapter id or use --all.");
    process.exit(1);
  }

  const results = [];
  for (const chapterId of chapterIds) {
    results.push(await enrichChapterPlan(bookDir, chapterId));
  }

  console.log(`Chapter builder updated ${results.length} chapter(s).`);
  for (const result of results) {
    console.log(`${result.chapterId}: ${result.state}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
