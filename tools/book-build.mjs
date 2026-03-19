import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

function hashText(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function escapeXml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

async function readFile(filePath) {
  return fs.readFile(filePath, "utf8");
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function listMarkdownFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(dirPath, entry.name))
    .sort();
}

function parseSimpleYaml(raw) {
  const data = {};
  const lines = raw.replace(/\r/g, "").split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_]+):(?:\s*(.*))?$/);
    if (!match) {
      index += 1;
      continue;
    }

    const [, key, rawValue = ""] = match;
    if (!rawValue.trim()) {
      const items = [];
      index += 1;
      while (index < lines.length && /^\s*-\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*-\s+/, "").trim());
        index += 1;
      }
      data[key] = items;
      continue;
    }

    data[key] = rawValue.trim().replace(/^['"]|['"]$/g, "");
    index += 1;
  }

  return data;
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) {
    return { data: {}, body: markdown };
  }

  const endIndex = markdown.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return { data: {}, body: markdown };
  }

  const frontmatter = markdown.slice(4, endIndex);
  const body = markdown.slice(endIndex + 5);
  return { data: parseSimpleYaml(frontmatter), body };
}

function extractTitle(markdownBody) {
  const match = markdownBody.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

function extractSummary(markdownBody) {
  const lines = markdownBody.replace(/\r/g, "").split("\n");
  let seenHeading = false;
  const paragraph = [];

  for (const line of lines) {
    if (!seenHeading && /^#\s+/.test(line)) {
      seenHeading = true;
      continue;
    }

    if (!seenHeading) {
      continue;
    }

    if (!line.trim()) {
      if (paragraph.length) {
        break;
      }
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      continue;
    }

    paragraph.push(line.trim());
  }

  return paragraph.join(" ");
}

function extractGeneratedDraft(planBody) {
  const match = planBody.match(/\n## Generated Draft\s*\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Missing '## Generated Draft' section.");
  }
  return match[1].trim() + "\n";
}

function extractFirstQuote(markdownBody) {
  const lines = markdownBody.replace(/\r/g, "").split("\n");
  const quote = [];
  let collecting = false;

  for (const line of lines) {
    if (line.startsWith("> ")) {
      collecting = true;
      quote.push(line.slice(2).trim());
      continue;
    }

    if (collecting) {
      break;
    }
  }

  return quote.join(" ");
}

async function loadState(statePath) {
  if (!(await fileExists(statePath))) {
    return { chapters: {}, outputs: {} };
  }

  return JSON.parse(await readFile(statePath));
}

async function writeIfChanged(filePath, content) {
  const exists = await fileExists(filePath);
  if (exists) {
    const current = await readFile(filePath);
    if (current === content) {
      return "unchanged";
    }
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
  return "updated";
}

function sectionEntryFromSpec(relativePath, markdown) {
  const { body } = parseFrontmatter(markdown);
  return {
    id: relativePath.replace(/\\/g, "/").replace(/\.md$/, ""),
    title: extractTitle(body),
    summary: extractSummary(body),
  };
}

async function buildAtlas(specsDir) {
  const groups = ["characters", "places", "concepts", "themes", "mechanics", "emotions"];
  const atlas = {};

  for (const group of groups) {
    const groupDir = path.join(specsDir, group);
    if (!(await fileExists(groupDir))) {
      atlas[group] = [];
      continue;
    }

    const files = await listMarkdownFiles(groupDir);
    atlas[group] = await Promise.all(
      files.map(async (filePath) => {
        const relativePath = path.relative(specsDir, filePath);
        return sectionEntryFromSpec(relativePath, await readFile(filePath));
      })
    );
  }

  return atlas;
}

function toBrowserPath(bookDir, filePath) {
  return `./${path.relative(bookDir, filePath).replace(/\\/g, "/")}`;
}

async function buildSourceEntry({ bookDir, rootDir, filePath, fallbackTitle }) {
  const raw = await readFile(filePath);
  const { data, body } = parseFrontmatter(raw);

  return {
    id: path.relative(rootDir, filePath).replace(/\\/g, "/").replace(/\.md$/, ""),
    title: data.title || extractTitle(body) || fallbackTitle,
    summary: data.summary || extractSummary(body),
    file: toBrowserPath(bookDir, filePath),
  };
}

async function buildSourceGroup({ bookDir, specsDir, relativeDir }) {
  const dirPath = path.join(specsDir, relativeDir);
  if (!(await fileExists(dirPath))) {
    return [];
  }

  const files = await listMarkdownFiles(dirPath);
  return Promise.all(
    files.map((filePath) => buildSourceEntry({ bookDir, rootDir: specsDir, filePath, fallbackTitle: path.basename(filePath, ".md") }))
  );
}

function wrapWords(text, maxLineLength = 16) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLineLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function pickVisualSpec(metadata, design, philosophyQuote) {
  return {
    title: design.displayTitle || metadata.title || "Untitled",
    subtitle: design.displaySubtitle || metadata.subtitle || "",
    author: design.displayAuthor || metadata.author || "",
    genre: design.displayGenre || metadata.genre || "Speculative Book",
    tone: design.displayTone || metadata.tone || "",
    logline: design.coverLogline || design.displayLogline || metadata.logline || "",
    coverBadge: design.coverBadge || design.displayGenre || metadata.genre || "Book",
    coverStyle: design.coverStyle || "annular-threshold",
    openingStyle: design.openingStyle || "paper-sigil",
    openingEyebrow: design.openingEyebrow || "Opening Page",
    openingQuote: design.openingQuote || philosophyQuote || metadata.logline || "",
    openingNote: design.openingNote || "Enter through the pattern, not around it.",
    openingLabel: design.openingLabel || "Abstract edition",
    bgStart: design.bgStart || "#102827",
    bgMid: design.bgMid || "#173b39",
    bgEnd: design.bgEnd || "#8d4a27",
    glowColor: design.glowColor || "#d8f2ea",
    foilColor: design.foilColor || "#f7ead0",
    accentColor: design.accentColor || "#67b5ab",
    paperColor: design.paperColor || "#f7f0e4",
    paperEdge: design.paperEdge || "#d6c6af",
    inkColor: design.inkColor || "#1d1814",
    mutedColor: design.mutedColor || "#65584c",
  };
}

function buildSvgDefs(spec) {
  return `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${escapeXml(spec.bgStart)}"/>
      <stop offset="42%" stop-color="${escapeXml(spec.bgMid)}"/>
      <stop offset="100%" stop-color="${escapeXml(spec.bgEnd)}"/>
    </linearGradient>
    <radialGradient id="glow" cx="54%" cy="38%" r="58%">
      <stop offset="0%" stop-color="${escapeXml(spec.glowColor)}" stop-opacity="0.84"/>
      <stop offset="55%" stop-color="${escapeXml(spec.accentColor)}" stop-opacity="0.26"/>
      <stop offset="100%" stop-color="${escapeXml(spec.accentColor)}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${escapeXml(spec.foilColor)}"/>
      <stop offset="100%" stop-color="${escapeXml(spec.bgEnd)}"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="28"/>
    </filter>
  </defs>
`;
}

function buildAbstractMotif(spec) {
  if (spec.coverStyle === "folded-shore") {
    return `
  <circle cx="1128" cy="650" r="330" fill="url(#glow)" filter="url(#soft)"/>
  <path d="M220 1430 C420 1296, 620 1300, 820 1428 C980 1530, 1120 1548, 1370 1460" fill="none" stroke="${escapeXml(spec.foilColor)}" stroke-width="8" opacity="0.78"/>
  <path d="M250 1542 C444 1424, 666 1436, 848 1554 C1038 1678, 1200 1678, 1386 1560" fill="none" stroke="${escapeXml(spec.glowColor)}" stroke-width="6" opacity="0.58"/>
  <path d="M296 1648 C510 1540, 706 1556, 894 1668 C1086 1780, 1234 1786, 1376 1690" fill="none" stroke="${escapeXml(spec.foilColor)}" stroke-width="4" opacity="0.44"/>
  <path d="M740 742 C842 522, 1238 542, 1324 758" fill="none" stroke="${escapeXml(spec.foilColor)}" stroke-width="7" opacity="0.84"/>
  <path d="M770 820 C890 694, 1170 700, 1284 840" fill="none" stroke="${escapeXml(spec.glowColor)}" stroke-width="5" opacity="0.54"/>
`;
  }

  return `
  <circle cx="1110" cy="720" r="360" fill="url(#glow)" filter="url(#soft)"/>
  <ellipse cx="1060" cy="770" rx="382" ry="290" fill="none" stroke="url(#foil)" stroke-width="10" opacity="0.92"/>
  <ellipse cx="1060" cy="770" rx="250" ry="182" fill="none" stroke="url(#foil)" stroke-width="8" opacity="0.88"/>
  <ellipse cx="1060" cy="770" rx="132" ry="92" fill="none" stroke="url(#foil)" stroke-width="7" opacity="0.95"/>
  <path d="M680 774 C780 520, 1290 520, 1398 774" fill="none" stroke="${escapeXml(spec.foilColor)}" stroke-width="6" opacity="0.78"/>
  <path d="M700 840 C860 1010, 1220 1010, 1376 812" fill="none" stroke="${escapeXml(spec.glowColor)}" stroke-width="4" opacity="0.52"/>
  <path d="M540 1050 C730 940, 913 948, 1170 1100" fill="none" stroke="${escapeXml(spec.foilColor)}" stroke-width="3" opacity="0.24"/>
`;
}

function buildDust(spec) {
  return `
  <g opacity="0.55">
    <circle cx="920" cy="560" r="9" fill="${escapeXml(spec.foilColor)}"/>
    <circle cx="1252" cy="622" r="7" fill="${escapeXml(spec.foilColor)}"/>
    <circle cx="892" cy="930" r="7" fill="${escapeXml(spec.glowColor)}"/>
    <circle cx="1326" cy="868" r="9" fill="${escapeXml(spec.glowColor)}"/>
    <circle cx="1196" cy="486" r="5" fill="${escapeXml(spec.glowColor)}"/>
    <circle cx="756" cy="732" r="5" fill="${escapeXml(spec.foilColor)}"/>
  </g>
`;
}

function buildAbstractCoverArtSvg(spec) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 2400" role="img" aria-label="${escapeXml(spec.title)} abstract art">
${buildSvgDefs(spec)}
  <rect width="1600" height="2400" rx="88" fill="url(#bg)"/>
  <rect x="62" y="62" width="1476" height="2276" rx="64" fill="none" stroke="${escapeXml(spec.foilColor)}" stroke-opacity="0.36" stroke-width="4"/>
  <rect x="106" y="106" width="1388" height="2188" rx="42" fill="none" stroke="${escapeXml(spec.foilColor)}" stroke-opacity="0.14" stroke-width="2"/>
  ${buildAbstractMotif(spec)}
  ${buildDust(spec)}
  <path d="M338 1912 C422 1836, 442 1688, 504 1620 C552 1566, 618 1540, 670 1548 C642 1608, 654 1682, 686 1736 C716 1786, 760 1830, 830 1866 C744 1904, 650 1932, 546 1940 C474 1946, 404 1938, 338 1912 Z" fill="${escapeXml(spec.inkColor)}" fill-opacity="0.26"/>
  <path d="M530 1658 C550 1600, 596 1564, 646 1564 C692 1564, 734 1598, 746 1646 C754 1684, 744 1718, 724 1750 C690 1806, 684 1868, 692 1936 L612 1936 C620 1862, 612 1800, 578 1750 C554 1716, 518 1692, 530 1658 Z" fill="${escapeXml(spec.foilColor)}" fill-opacity="0.14"/>
</svg>
`;
}

function buildCoverPageSvg(spec) {
  const titleLines = wrapWords(spec.title, 14).slice(0, 3);
  const subtitleLines = wrapWords(spec.subtitle, 44).slice(0, 2);
  const loglineLines = wrapWords(spec.logline, 52).slice(0, 5);
  const titleStartY = titleLines.length > 2 ? 1364 : 1428;

  const titleSvg = titleLines
    .map(
      (line, index) => `<text x="166" y="${titleStartY + index * 136}" font-family="Georgia, 'Times New Roman', serif" font-size="${index === 0 ? 132 : 118}" fill="${escapeXml(spec.foilColor)}" letter-spacing="1.5">${escapeXml(line)}</text>`
    )
    .join("");

  const subtitleSvg = subtitleLines.length
    ? `<text x="170" y="1856" font-family="'Segoe UI', Arial, sans-serif" font-size="38" fill="${escapeXml(spec.foilColor)}" opacity="0.92">${subtitleLines
        .map((line, index) => `<tspan x="170" dy="${index === 0 ? 0 : 44}">${escapeXml(line)}</tspan>`)
        .join("")}</text>`
    : "";

  const loglineSvg = loglineLines.length
    ? `<text x="170" y="1982" font-family="'Segoe UI', Arial, sans-serif" font-size="24" fill="${escapeXml(spec.foilColor)}" opacity="0.74">${loglineLines
        .map((line, index) => `<tspan x="170" dy="${index === 0 ? 0 : 32}">${escapeXml(line)}</tspan>`)
        .join("")}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 2400" role="img" aria-label="${escapeXml(spec.title)} cover page">
${buildSvgDefs(spec)}
  <rect width="1600" height="2400" rx="88" fill="url(#bg)"/>
  <rect width="1600" height="2400" rx="88" fill="#071118" fill-opacity="0.08"/>
  <rect x="62" y="62" width="1476" height="2276" rx="64" fill="none" stroke="${escapeXml(spec.foilColor)}" stroke-opacity="0.4" stroke-width="4"/>
  <rect x="106" y="106" width="1388" height="2188" rx="42" fill="none" stroke="${escapeXml(spec.foilColor)}" stroke-opacity="0.18" stroke-width="2"/>
  ${buildAbstractMotif(spec)}
  ${buildDust(spec)}
  <path d="M0 1768 C234 1660, 410 1618, 676 1656 C876 1684, 1094 1762, 1600 1910 L1600 2400 L0 2400 Z" fill="#061017" fill-opacity="0.32"/>
  <rect x="132" y="1198" width="878" height="1010" rx="52" fill="#07131c" fill-opacity="0.24" stroke="${escapeXml(spec.foilColor)}" stroke-opacity="0.14"/>
  <rect x="156" y="1222" width="830" height="962" rx="34" fill="none" stroke="${escapeXml(spec.glowColor)}" stroke-opacity="0.08"/>
  <rect x="136" y="130" width="420" height="62" rx="31" fill="${escapeXml(spec.paperColor)}" fill-opacity="0.12" stroke="${escapeXml(spec.foilColor)}" stroke-opacity="0.18"/>
  <text x="164" y="170" font-family="'Segoe UI', Arial, sans-serif" font-size="33" letter-spacing="7" fill="${escapeXml(spec.glowColor)}">${escapeXml(String(spec.coverBadge).toUpperCase())}</text>
  ${titleSvg}
  ${subtitleSvg}
  <line x1="170" y1="1918" x2="856" y2="1918" stroke="${escapeXml(spec.foilColor)}" stroke-opacity="0.24" stroke-width="2"/>
  ${loglineSvg}
  <line x1="170" y1="2108" x2="634" y2="2108" stroke="${escapeXml(spec.glowColor)}" stroke-opacity="0.18" stroke-width="2"/>
  <text x="170" y="2160" font-family="'Segoe UI', Arial, sans-serif" font-size="30" fill="${escapeXml(spec.glowColor)}" opacity="0.92">${escapeXml(spec.author)}</text>
</svg>
`;
}

function buildOpeningPageSvg(spec) {
  const titleLines = wrapWords(spec.title, 18).slice(0, 3);
  const subtitleLines = wrapWords(spec.subtitle, 40).slice(0, 2);
  const quoteLines = wrapWords(spec.openingQuote, 46).slice(0, 7);
  const noteLines = wrapWords(spec.openingNote, 54).slice(0, 3);
  const quoteFontSize = quoteLines.length > 5 ? 36 : 40;
  const quoteStep = quoteLines.length > 5 ? 46 : 52;
  const subtitleY = 1020;
  const dividerY = subtitleY + Math.max(subtitleLines.length - 1, 0) * 40 + 126;
  const quoteY = dividerY + 114;
  const noteY = Math.min(1820, quoteY + Math.max(quoteLines.length - 1, 0) * quoteStep + 164);

  const titleSvg = titleLines
    .map(
      (line, index) => `<text x="210" y="${730 + index * 108}" font-family="Georgia, 'Times New Roman', serif" font-size="${index === 0 ? 104 : 92}" fill="${escapeXml(spec.inkColor)}">${escapeXml(line)}</text>`
    )
    .join("");

  const subtitleSvg = subtitleLines.length
    ? `<text x="214" y="${subtitleY}" font-family="'Segoe UI', Arial, sans-serif" font-size="34" fill="${escapeXml(spec.mutedColor)}">${subtitleLines
        .map((line, index) => `<tspan x="214" dy="${index === 0 ? 0 : 40}">${escapeXml(line)}</tspan>`)
        .join("")}</text>`
    : "";

  const quoteSvg = quoteLines.length
    ? `<text x="214" y="${quoteY}" font-family="Georgia, 'Times New Roman', serif" font-size="${quoteFontSize}" fill="${escapeXml(spec.inkColor)}">${quoteLines
        .map((line, index) => `<tspan x="214" dy="${index === 0 ? 0 : quoteStep}">${escapeXml(line)}</tspan>`)
        .join("")}</text>`
    : "";

  const noteSvg = noteLines.length
    ? `<text x="214" y="${noteY}" font-family="'Segoe UI', Arial, sans-serif" font-size="28" fill="${escapeXml(spec.mutedColor)}">${noteLines
        .map((line, index) => `<tspan x="214" dy="${index === 0 ? 0 : 36}">${escapeXml(line)}</tspan>`)
        .join("")}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 2400" role="img" aria-label="${escapeXml(spec.title)} opening page">
  <rect width="1600" height="2400" rx="88" fill="${escapeXml(spec.paperColor)}"/>
  <rect x="78" y="78" width="1444" height="2244" rx="56" fill="none" stroke="${escapeXml(spec.paperEdge)}" stroke-width="4"/>
  <rect x="124" y="124" width="1352" height="2152" rx="34" fill="none" stroke="${escapeXml(spec.paperEdge)}" stroke-opacity="0.52" stroke-width="2"/>
  <rect x="180" y="1164" width="1230" height="846" rx="42" fill="#ffffff" fill-opacity="0.32" stroke="${escapeXml(spec.paperEdge)}" stroke-opacity="0.42"/>
  <circle cx="1130" cy="540" r="224" fill="${escapeXml(spec.glowColor)}" fill-opacity="0.18"/>
  <ellipse cx="1080" cy="566" rx="244" ry="168" fill="none" stroke="${escapeXml(spec.accentColor)}" stroke-width="7" stroke-opacity="0.52"/>
  <ellipse cx="1080" cy="566" rx="152" ry="96" fill="none" stroke="${escapeXml(spec.foilColor)}" stroke-width="5" stroke-opacity="0.72"/>
  <path d="M868 564 C940 430, 1226 438, 1294 568" fill="none" stroke="${escapeXml(spec.foilColor)}" stroke-width="4" stroke-opacity="0.7"/>
  <text x="214" y="226" font-family="'Segoe UI', Arial, sans-serif" font-size="30" letter-spacing="6" fill="${escapeXml(spec.accentColor)}">${escapeXml(String(spec.openingEyebrow).toUpperCase())}</text>
  <text x="214" y="292" font-family="'Segoe UI', Arial, sans-serif" font-size="24" letter-spacing="4" fill="${escapeXml(spec.mutedColor)}">${escapeXml(String(spec.openingLabel).toUpperCase())}</text>
  ${titleSvg}
  ${subtitleSvg}
  <line x1="214" y1="${dividerY}" x2="1324" y2="${dividerY}" stroke="${escapeXml(spec.paperEdge)}" stroke-width="2"/>
  ${quoteSvg}
  <line x1="214" y1="${noteY - 58}" x2="704" y2="${noteY - 58}" stroke="${escapeXml(spec.paperEdge)}" stroke-opacity="0.84" stroke-width="2"/>
  ${noteSvg}
  <text x="214" y="2140" font-family="'Segoe UI', Arial, sans-serif" font-size="30" fill="${escapeXml(spec.accentColor)}">${escapeXml(spec.author)}</text>
</svg>
`;
}

function buildHtmlShell({ manifestPath, title }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module">
    import { renderBook } from "../preview/preview.js";
    renderBook({
      root: document.getElementById("app"),
      manifestUrl: "${manifestPath}"
    });
  </script>
</body>
</html>
`;
}

async function main() {
  const targetArg = process.argv[2];
  if (!targetArg) {
    console.error("Usage: node tools/book-build.mjs docs/<book-slug>");
    process.exit(1);
  }

  const bookDir = path.resolve(process.cwd(), targetArg);
  const specsDir = path.join(bookDir, "specs");
  const chapterPlansDir = path.join(specsDir, "chapter-plans");
  const chaptersDir = path.join(bookDir, "chapters");
  const buildDir = path.join(bookDir, "build");
  const metadataPath = path.join(specsDir, "metadata.md");
  const bookPlanPath = path.join(specsDir, "book-plan.md");
  const bookDesignPath = path.join(specsDir, "book-design.md");
  const statePath = path.join(buildDir, "state.json");
  const manifestPath = path.join(buildDir, "manifest.json");
  const coverArtPath = path.join(buildDir, "cover-art.svg");
  const coverPagePath = path.join(buildDir, "cover-page.svg");
  const openingPagePath = path.join(buildDir, "opening-page.svg");
  const bookHtmlPath = path.join(bookDir, "book.html");

  const metadataRaw = await readFile(metadataPath);
  const { data: metadata } = parseFrontmatter(metadataRaw);
  const bookPlanRaw = await readFile(bookPlanPath);
  const { body: bookPlanBody } = parseFrontmatter(bookPlanRaw);
  const designRaw = await readFile(bookDesignPath);
  const { data: design } = parseFrontmatter(designRaw);
  const state = await loadState(statePath);
  const philosophyQuote = extractFirstQuote(bookPlanBody);
  const visualSpec = pickVisualSpec(metadata, design, philosophyQuote);

  const chapterOrder = metadata.chapterOrder || [];
  const atlas = await buildAtlas(specsDir);
  const chapterRecords = [];
  const chapterChanges = [];

  for (const chapterId of chapterOrder) {
    const planPath = path.join(chapterPlansDir, `${chapterId}.md`);
    const planRaw = await readFile(planPath);
    const { data: planMeta, body: planBody } = parseFrontmatter(planRaw);
    const dependencyPaths = [metadataPath, planPath];

    for (const relativeDependency of planMeta.dependsOn || []) {
      dependencyPaths.push(path.join(specsDir, relativeDependency));
    }

    const dependencyChunks = await Promise.all(
      dependencyPaths.map(async (dependencyPath) => `${dependencyPath}\n${await readFile(dependencyPath)}`)
    );
    const inputHash = hashText(dependencyChunks.join("\n---\n"));
    const outputPath = path.join(chaptersDir, `${chapterId}.md`);

    let outputState = "unchanged";
    if (state.chapters[chapterId] !== inputHash || !(await fileExists(outputPath))) {
      const generatedDraft = extractGeneratedDraft(planBody);
      const chapterOutput = `---\ntitle: ${planMeta.title || chapterId}\nsourcePlan: specs/chapter-plans/${chapterId}.md\n---\n\n${generatedDraft}`;
      outputState = await writeIfChanged(outputPath, chapterOutput);
    }

    state.chapters[chapterId] = inputHash;
    chapterChanges.push(`${chapterId}: ${outputState}`);
    chapterRecords.push({
      id: chapterId,
      title: planMeta.title || chapterId,
      summary: planMeta.summary || "",
      chapterFile: `./chapters/${chapterId}.md`,
      sourcePlanFile: `./specs/chapter-plans/${chapterId}.md`,
    });
  }

  const sourceMaterials = {
    specs: {
      core: [
        await buildSourceEntry({ bookDir, rootDir: specsDir, filePath: metadataPath, fallbackTitle: "Metadata" }),
        await buildSourceEntry({ bookDir, rootDir: specsDir, filePath: bookPlanPath, fallbackTitle: "Book Plan" }),
        await buildSourceEntry({ bookDir, rootDir: specsDir, filePath: bookDesignPath, fallbackTitle: "Book Design" }),
      ],
      chapterPlans: await Promise.all(
        chapterOrder.map((chapterId) =>
          buildSourceEntry({
            bookDir,
            rootDir: specsDir,
            filePath: path.join(chapterPlansDir, `${chapterId}.md`),
            fallbackTitle: chapterId,
          })
        )
      ),
      characters: await buildSourceGroup({ bookDir, specsDir, relativeDir: "characters" }),
      places: await buildSourceGroup({ bookDir, specsDir, relativeDir: "places" }),
      concepts: await buildSourceGroup({ bookDir, specsDir, relativeDir: "concepts" }),
      themes: await buildSourceGroup({ bookDir, specsDir, relativeDir: "themes" }),
      mechanics: await buildSourceGroup({ bookDir, specsDir, relativeDir: "mechanics" }),
      relationships: await buildSourceGroup({ bookDir, specsDir, relativeDir: "relationships" }),
      emotions: await buildSourceGroup({ bookDir, specsDir, relativeDir: "emotions" }),
    },
    generated: {
      chapters: chapterRecords.map((chapter) => ({
        id: chapter.id,
        title: chapter.title,
        summary: chapter.summary,
        file: chapter.chapterFile,
        sourcePlanFile: chapter.sourcePlanFile,
      })),
    },
  };

  const manifest = {
    title: visualSpec.title,
    subtitle: visualSpec.subtitle,
    author: visualSpec.author,
    genre: visualSpec.genre,
    tone: visualSpec.tone,
    logline: visualSpec.logline,
    coverArtImage: "./build/cover-art.svg",
    coverPageImage: "./build/cover-page.svg",
    openingPageImage: "./build/opening-page.svg",
    coverImage: "./build/cover-page.svg",
    philosophyQuote: visualSpec.openingQuote,
    atlas,
    sources: sourceMaterials,
    chapters: chapterRecords,
  };

  const coverArtSvg = buildAbstractCoverArtSvg(visualSpec);
  const coverPageSvg = buildCoverPageSvg(visualSpec);
  const openingPageSvg = buildOpeningPageSvg(visualSpec);
  const coverArtState = await writeIfChanged(coverArtPath, coverArtSvg);
  const coverPageState = await writeIfChanged(coverPagePath, coverPageSvg);
  const openingPageState = await writeIfChanged(openingPagePath, openingPageSvg);
  const manifestState = await writeIfChanged(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const htmlShell = buildHtmlShell({
    manifestPath: "./build/manifest.json",
    title: visualSpec.title || "Book Viewer",
  });
  const htmlState = await writeIfChanged(bookHtmlPath, htmlShell);

  state.outputs = {
    coverArt: hashText(coverArtSvg),
    coverPage: hashText(coverPageSvg),
    openingPage: hashText(openingPageSvg),
    manifest: hashText(JSON.stringify(manifest)),
    bookHtml: hashText(htmlShell),
  };

  await writeIfChanged(statePath, JSON.stringify(state, null, 2) + "\n");

  console.log(`Built ${metadata.title || targetArg}`);
  console.log(`Cover art: ${coverArtState}`);
  console.log(`Cover page: ${coverPageState}`);
  console.log(`Opening page: ${openingPageState}`);
  console.log(`Manifest: ${manifestState}`);
  console.log(`book.html: ${htmlState}`);
  for (const change of chapterChanges) {
    console.log(change);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
