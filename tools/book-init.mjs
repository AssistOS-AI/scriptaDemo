import fs from "node:fs/promises";
import path from "node:path";

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function writeIfMissing(filePath, content) {
  if (await fileExists(filePath)) {
    return "skipped";
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
  return "created";
}

function titleFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

async function main() {
  const slug = process.argv[2];
  const title = process.argv.slice(3).join(" ").trim() || titleFromSlug(slug || "");

  if (!slug) {
    console.error("Usage: node tools/book-init.mjs <book-slug> [Book Title]");
    process.exit(1);
  }

  const bookDir = path.resolve(process.cwd(), "docs", slug);
  const specsDir = path.join(bookDir, "specs");

  const files = [
    [
      path.join(specsDir, "metadata.md"),
      `---\ntitle: ${title}\nsubtitle: Add subtitle here\nslug: ${slug}\nauthor: Add author here\ngenre: Add genre here\ntone: Add tone here\nlogline: Add logline here\nchapterOrder:\n  - 01-opening\n---\n\n# Metadata\n\nFill in the metadata and chapter order for the book.\n`,
    ],
    [
      path.join(specsDir, "book-plan.md"),
      `# ${title} Book Plan\n\n## Premise\n\nDescribe the core idea.\n\n## Themes\n\nList the main themes.\n\n## Chapter Arc\n\nMap the progression from opening to ending.\n`,
    ],
    [
      path.join(specsDir, "book-design.md"),
      `---\ntitle: Book Design\ndisplayTitle: ${title}\ndisplaySubtitle: Add subtitle here\ndisplayAuthor: Add author here\ndisplayGenre: Add genre label here\ndisplayTone: Add tone here\ncoverBadge: Add cover badge here\ncoverStyle: annular-threshold\nopeningStyle: paper-sigil\nopeningEyebrow: Opening Page\nopeningLabel: Abstract Edition\nopeningQuote: Add an opening quote here\nopeningNote: Add an opening note here\ncoverLogline: Add cover logline here\nbgStart: #102827\nbgMid: #173b39\nbgEnd: #8d4a27\nglowColor: #d8f2ea\nfoilColor: #f7ead0\naccentColor: #67b5ab\npaperColor: #f7f0e4\npaperEdge: #d6c6af\ninkColor: #1d1814\nmutedColor: #65584c\n---\n\n# Book Design\n\n## Purpose\n\nStore all cover and opening-page display text plus abstract visual direction here.\n\n## Notes\n\n- Keep this file as the display-facing source for the generated SVG assets.\n- Prefer short, typeset-friendly cover/opening text instead of a full synopsis.\n- The build should generate 'cover-art.svg', 'cover-page.svg', and 'opening-page.svg' from this file.\n\n## Visual Direction\n\nDescribe the abstract motifs, mood, and composition rules for the generated SVG assets.\n`,
    ],
    [
      path.join(specsDir, "chapter-plans", "01-opening.md"),
      `---\nid: 01-opening\ntitle: Opening\nsummary: Introduce the protagonist, setting, and first disturbance.\ndependsOn:\n  - book-plan.md\n  - characters/protagonist.md\n  - emotions/character-emotional-arcs.md\n---\n\n# Chapter Plan\n\n## Purpose\n\nOpen the story with a concrete disturbance.\n\n## Key Beats\n\n- Introduce the protagonist.\n- Introduce the problem.\n- Establish the next question.\n\n## Generated Draft\n\n# Opening\n\nWrite the initial chapter draft here.\n`,
    ],
    [
      path.join(specsDir, "characters", "protagonist.md"),
      `# Protagonist\n\n## Role\n\nDescribe the protagonist.\n`,
    ],
    [
      path.join(specsDir, "places", "primary-setting.md"),
      `# Primary Setting\n\n## Function\n\nDescribe the main place.\n`,
    ],
    [
      path.join(specsDir, "concepts", "central-idea.md"),
      `# Central Idea\n\n## Meaning\n\nDescribe the governing concept.\n`,
    ],
    [
      path.join(specsDir, "emotions", "character-emotional-arcs.md"),
      `# Character Emotional Arcs\n\n## Emotional Targets\n\nDescribe the planned emotional motion of the characters.\n`,
    ],
  ];

  const results = [];
  for (const [filePath, content] of files) {
    results.push(`${path.relative(process.cwd(), filePath)}: ${await writeIfMissing(filePath, content)}`);
  }

  await fs.mkdir(path.join(bookDir, "chapters"), { recursive: true });
  await fs.mkdir(path.join(bookDir, "build"), { recursive: true });

  console.log(`Initialized docs/${slug}`);
  for (const result of results) {
    console.log(result);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
