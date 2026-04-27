import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import { buildChapterContext, validateChapterContext } from "./chapter-generator.mjs";

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

async function listSpecGroups(specsDir) {
  const entries = await fs.readdir(specsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory() && entry.name !== "chapter-plans")
    .map((entry) => entry.name)
    .sort();
}

async function listRootSpecFiles(specsDir) {
  const entries = await fs.readdir(specsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(specsDir, entry.name))
    .sort();
}

async function buildAtlas(specsDir) {
  const preferredGroups = [
    "characters",
    "places",
    "concepts",
    "themes",
    "mechanics",
    "emotions",
    "relationships",
    "plot-elements",
    "special-objects",
    "events",
  ];
  const availableGroups = new Set(await listSpecGroups(specsDir));
  const atlas = {};

  for (const group of preferredGroups) {
    const groupDir = path.join(specsDir, group);
    if (!availableGroups.has(group) || !(await fileExists(groupDir))) {
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

async function buildDynamicSpecSourceGroups({ bookDir, specsDir, chapterOrder }) {
  const rootFiles = await listRootSpecFiles(specsDir);
  const specGroups = {
    core: await Promise.all(
      rootFiles.map((filePath) =>
        buildSourceEntry({
          bookDir,
          rootDir: specsDir,
          filePath,
          fallbackTitle: path.basename(filePath, ".md"),
        })
      )
    ),
    chapterPlans: await Promise.all(
      chapterOrder.map((chapterId) =>
        buildSourceEntry({
          bookDir,
          rootDir: specsDir,
          filePath: path.join(specsDir, "chapter-plans", `${chapterId}.md`),
          fallbackTitle: chapterId,
        })
      )
    ),
  };

  for (const group of await listSpecGroups(specsDir)) {
    specGroups[group] = await buildSourceGroup({ bookDir, specsDir, relativeDir: group });
  }

  return specGroups;
}

async function buildGlobalConsistencyReport({ bookDir, specsDir, chapterOrder, chapterReports, chapterMetas }) {
  const errors = [];
  const warnings = [];
  const seenIds = new Set();
  const duplicateChapterIds = [];
  const referencedSpecs = new Set(["metadata.md", "book-plan.md", "book-design.md", "story-core.md"]);

  for (const chapterId of chapterOrder) {
    if (seenIds.has(chapterId)) {
      duplicateChapterIds.push(chapterId);
    }
    seenIds.add(chapterId);
  }

  if (duplicateChapterIds.length) {
    errors.push(`Duplicate chapter ids in metadata.chapterOrder: ${duplicateChapterIds.join(", ")}`);
  }

  for (const meta of chapterMetas) {
    referencedSpecs.add(`chapter-plans/${meta.id}.md`);
    for (const dependency of meta.dependsOn || []) {
      referencedSpecs.add(String(dependency));
    }
  }

  const orphanedSpecs = [];
  for (const group of await listSpecGroups(specsDir)) {
    const files = await listMarkdownFiles(path.join(specsDir, group));
    for (const filePath of files) {
      const relativePath = path.relative(specsDir, filePath).replace(/\\/g, "/");
      if (!referencedSpecs.has(relativePath)) {
        orphanedSpecs.push(relativePath);
      }
    }
  }

  if (orphanedSpecs.length) {
    warnings.push(`Spec files not referenced by any chapter dependency: ${orphanedSpecs.join(", ")}`);
  }

  const failedChapters = chapterReports.filter((report) => report.status === "fail");
  const warningChapters = chapterReports.filter((report) => report.warnings.length);

  if (failedChapters.length) {
    errors.push(`Chapters with consistency failures: ${failedChapters.map((report) => report.chapterId).join(", ")}`);
  }

  return {
    status: errors.length ? "fail" : warnings.length || warningChapters.length ? "warn" : "pass",
    summary: {
      chapters: chapterOrder.length,
      failedChapters: failedChapters.length,
      warningChapters: warningChapters.length,
      orphanedSpecs: orphanedSpecs.length,
    },
    errors,
    warnings,
    orphanedSpecs,
    chapterReports,
    builtAt: new Date().toISOString(),
    buildRoot: bookDir,
  };
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

// ─── Markdown Renderer ────────────────────────────────────────

function readerEscapeHtml(text) {
  return String(text ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function readerFormatInline(text) {
  return readerEscapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function readerStripFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) return markdown;
  const endIndex = markdown.indexOf("\n---\n", 4);
  if (endIndex === -1) return markdown;
  return markdown.slice(endIndex + 5);
}

function readerMarkdownToHtml(markdown) {
  const lines = readerStripFrontmatter(markdown).replace(/\r/g, "").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      index += 1;
      blocks.push(`<pre><code>${readerEscapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      blocks.push(`<h${level}>${readerFormatInline(heading[2].trim())}</h${level}>`);
      index += 1;
      continue;
    }

    if (line.startsWith("> ")) {
      const quote = [];
      while (index < lines.length && lines[index].startsWith("> ")) {
        quote.push(lines[index].slice(2).trim());
        index += 1;
      }
      blocks.push(`<blockquote>${quote.map(readerFormatInline).join("<br>")}</blockquote>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^\d+\.\s+/, "").trim());
        index += 1;
      }
      blocks.push(`<ol>${items.map((item) => `<li>${readerFormatInline(item)}</li>`).join("")}</ol>`);
      continue;
    }

    if (/^-\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^-\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^-\s+/, "").trim());
        index += 1;
      }
      blocks.push(`<ul>${items.map((item) => `<li>${readerFormatInline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    const paragraph = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3})\s+/.test(lines[index]) &&
      !lines[index].startsWith("> ") &&
      !lines[index].startsWith("```") &&
      !/^-\s+/.test(lines[index]) &&
      !/^\d+\.\s+/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(`<p>${readerFormatInline(paragraph.join(" "))}</p>`);
  }

  return blocks.join("\n");
}

// ─── Language Strings ──────────────────────────────────────────

const LANG_STRINGS = {
  en: {
    tableOfContents: "Table of Contents",
    chapter: "Chapter",
    page: "Page",
    of: "of",
    previous: "Previous",
    next: "Next",
    closeToc: "Close",
    openToc: "Contents",
    jumpToChapter: "Jump to chapter",
    bookReader: "Book Reader",
    closingTitle: "End of the Book",
    closingNote: "Thank you for reading.",
    worldOverview: "World Overview",
    worldOverviewSub: "Characters, places, and concepts from this book.",
    detailsNote: "The full specification layer remains available through the source materials.",
    coverAlt: "cover",
    openingAlt: "opening page",
  },
  ro: {
    tableOfContents: "Cuprins",
    chapter: "Capitolul",
    page: "Pagina",
    of: "din",
    previous: "Anterior",
    next: "Urm\u0103tor",
    closeToc: "\u00CEnchide",
    openToc: "Cuprins",
    jumpToChapter: "Sari la capitol",
    bookReader: "Cititor de carte",
    closingTitle: "Sf\u00E2r\u0219itul c\u0103r\u021Bii",
    closingNote: "V\u0103 mul\u021Bumim pentru lectur\u0103.",
    worldOverview: "Privire de ansamblu",
    worldOverviewSub: "Personaje, locuri \u0219i concepte din aceast\u0103 carte.",
    detailsNote: "Specifica\u021Biile complete sunt disponible prin materialele surs\u0103.",
    coverAlt: "copert\u0103",
    openingAlt: "pagin\u0103 de deschidere",
  },
};

// ─── Self-Contained Reader Builder ────────────────────────────

function buildSelfContainedReader({ manifest, visualSpec, chaptersData, coverPageSvg, openingPageSvg, lang }) {
  const strings = LANG_STRINGS[lang] || LANG_STRINGS.en;
  const htmlLang = lang === "ro" ? "ro" : "en";

  const bookData = {
    title: visualSpec.title,
    subtitle: visualSpec.subtitle,
    author: visualSpec.author,
    genre: visualSpec.genre,
    logline: visualSpec.logline,
    openingQuote: visualSpec.openingQuote,
    openingNote: visualSpec.openingNote,
    chapters: chaptersData.map((ch) => ({
      id: ch.id,
      title: ch.title,
      summary: ch.summary,
      html: readerMarkdownToHtml(ch.markdown),
    })),
    atlas: manifest.atlas,
    strings,
  };

  const bookDataJson = JSON.stringify(bookData);

  const coverSvgB64 = `data:image/svg+xml;base64,${Buffer.from(coverPageSvg).toString("base64")}`;
  const openingSvgB64 = `data:image/svg+xml;base64,${Buffer.from(openingPageSvg).toString("base64")}`;

  const css = buildReaderCSS(visualSpec);
  const js = buildReaderJS();

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${readerEscapeHtml(visualSpec.title)}</title>
<style>${css}</style>
</head>
<body book-lang="${htmlLang}">
<div id="app"></div>
<script>var BOOK_DATA=${bookDataJson};var COVER_SRC="${coverSvgB64}";var OPENING_SRC="${openingSvgB64}";</script>
<script>${js}</script>
</body>
</html>`;
}

function buildReaderCSS(spec) {
  return `
*,*::before,*::after{box-sizing:border-box}
:root{
--desk:${spec.bgStart};
--paper:${spec.paperColor};
--paper-strong:#fdf8ef;
--paper-edge:${spec.paperEdge};
--ink:${spec.inkColor};
--muted:${spec.mutedColor};
--accent:${spec.accentColor};
--accent-soft:${spec.accentColor}1a;
--foil:${spec.foilColor};
--glow:${spec.glowColor};
--bg-end:${spec.bgEnd};
--serif:Georgia,"Palatino Linotype","Book Antiqua",Palatino,serif;
--sans:"Segoe UI","Helvetica Neue",Arial,sans-serif;
--mono:"IBM Plex Mono",Consolas,monospace;
}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--desk);color:var(--ink);font-family:var(--serif);line-height:1.72;letter-spacing:0.002em}
a{color:var(--accent)}
.app-shell{min-height:100vh;background:radial-gradient(circle at top left,${spec.accentColor}22,transparent 26%),radial-gradient(circle at 82% 10%,${spec.foilColor}22,transparent 22%),linear-gradient(180deg,#3a2e28 0%,var(--desk) 100%)}
.book-nav{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 18px;background:rgba(26,22,20,0.94);backdrop-filter:blur(18px);border-bottom:1px solid rgba(255,248,238,0.08);color:#f9efdf}
.book-nav__brand{min-width:0}
.book-nav__eyebrow{font-size:0.72rem;letter-spacing:0.14em;text-transform:uppercase;color:rgba(249,239,223,0.58);font-family:var(--sans)}
.book-nav__title{margin-top:2px;font-size:1.04rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.book-nav__controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.nav-btn,.nav-select{appearance:none;border:none;background:rgba(255,248,238,0.1);color:#f9efdf;border-radius:6px;padding:7px 13px;font:inherit;font-size:0.86rem;transition:background 150ms ease;cursor:pointer}
.nav-btn:hover,.nav-select:hover,.nav-btn:focus-visible,.nav-select:focus-visible{background:rgba(255,248,238,0.22);outline:none}
.nav-btn[disabled]{opacity:0.38;cursor:not-allowed}
.nav-counter{padding:7px 12px;border-radius:6px;background:var(--accent-soft);color:#dcf3ec;font-size:0.84rem;font-weight:700;letter-spacing:0.02em;font-family:var(--sans)}
.book-content{max-width:780px;margin:0 auto;padding:0 18px}
.book-section{margin:0;padding:0}
.section-cover,.section-opening{display:flex;align-items:center;justify-content:center;min-height:88vh;padding:32px 0}
.section-cover img,.section-opening img{max-width:100%;max-height:88vh;border-radius:18px;box-shadow:0 28px 64px rgba(0,0,0,0.32)}
.section-toc{min-height:60vh;padding:48px 0 32px}
.section-toc h2{font-family:var(--serif);font-size:2rem;line-height:1.08;color:var(--ink);margin:0 0 8px}
.section-toc__sub{color:var(--muted);font-size:1rem;margin:0 0 28px;line-height:1.62}
.toc-list{display:grid;gap:6px}
.toc-item{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:start;padding:12px 14px;border-radius:8px;background:rgba(255,255,255,0.38);border:none;cursor:pointer;transition:background 130ms ease;text-align:left;width:100%;font:inherit;color:var(--ink)}
.toc-item:hover{background:rgba(255,255,255,0.62)}
.toc-item__num{width:30px;height:30px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--accent-soft);color:var(--accent);font-size:0.86rem;font-weight:800;font-family:var(--sans)}
.toc-item__text strong{display:block;margin-bottom:2px}
.toc-item__text span{color:var(--muted);font-size:0.92rem;line-height:1.48}
.section-atlas{padding:40px 0 32px}
.section-atlas h2{font-family:var(--serif);font-size:1.8rem;line-height:1.1;color:var(--ink);margin:0 0 6px}
.section-atlas__sub{color:var(--muted);font-size:1rem;margin:0 0 24px;line-height:1.62}
.atlas-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.atlas-panel{padding:14px;border-radius:8px;background:rgba(255,255,255,0.38)}
.atlas-panel h3{margin:0 0 8px;font-size:0.82rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);font-family:var(--sans)}
.atlas-panel ul{list-style:none;padding:0;margin:0;display:grid;gap:8px}
.atlas-panel li strong{display:block;margin-bottom:1px}
.atlas-panel li span{color:var(--muted);font-size:0.9rem;line-height:1.5}
.chapter{padding:0 0 48px;border-top:1px solid var(--paper-edge)}
.chapter__header{padding-top:48px;padding-bottom:16px}
.chapter__number{display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:4px;background:var(--accent-soft);color:var(--accent);font-size:0.74rem;letter-spacing:0.1em;text-transform:uppercase;font-weight:800;font-family:var(--sans)}
.chapter__title{font-family:var(--serif);font-size:clamp(2rem,4vw,2.8rem);line-height:1.12;color:var(--ink);margin:12px 0 0;max-width:16ch}
.chapter__summary{color:var(--muted);margin:10px 0 0;line-height:1.62;font-size:1rem}
.chapter__divider{height:1px;margin:24px 0;background:linear-gradient(90deg,var(--paper-edge),transparent)}
.chapter__body{font-family:var(--serif);font-size:1.06rem;line-height:1.74;color:var(--ink)}
.chapter__body p,.chapter__body ul,.chapter__body ol,.chapter__body blockquote,.chapter__body pre{margin:0 0 1.1em}
.chapter__body h1,.chapter__body h2,.chapter__body h3{margin:1.28em 0 0.48em;font-family:var(--serif);line-height:1.12;color:var(--ink)}
.chapter__body h1{font-size:1.8rem}
.chapter__body h2{font-size:1.36rem}
.chapter__body h3{font-size:1.12rem}
.chapter__body blockquote{padding:12px 16px;border-left:3px solid var(--accent);border-radius:4px;background:var(--accent-soft);color:var(--ink)}
.chapter__body code,.chapter__body pre{font-family:var(--mono)}
.chapter__body code{padding:0.1em 0.32em;border-radius:0.4em;background:rgba(23,19,16,0.08);font-size:0.92em}
.chapter__body pre{padding:14px;border-radius:4px;background:#1a1714;color:#f9f0e1;overflow:auto;font-size:0.86rem;line-height:1.55}
.chapter__body ul,.chapter__body ol{padding-left:1.15rem}
.chapter__body li+li{margin-top:0.38em}
.chapter__footer{margin-top:28px;padding-top:14px;border-top:1px solid var(--paper-edge);display:flex;justify-content:space-between;color:var(--muted);font-size:0.82rem;letter-spacing:0.04em;font-family:var(--sans)}
.section-closing{padding:56px 0 64px;text-align:center}
.section-closing h2{font-family:var(--serif);font-size:1.6rem;color:var(--ink);margin:0 0 8px}
.section-closing p{color:var(--muted);line-height:1.62;font-size:1rem;max-width:36ch;margin:0 auto 16px}
.closing-quote{margin:20px auto;max-width:48ch;padding:14px 18px;border-left:3px solid var(--accent);border-radius:4px;background:var(--accent-soft);color:var(--ink);line-height:1.72;font-family:var(--serif);font-size:1.04rem;text-align:left}
.paper-sheet{background:linear-gradient(180deg,var(--paper-strong),var(--paper));max-width:780px;margin:0 auto;padding:40px 32px 32px;border-radius:0 0 12px 12px;box-shadow:0 8px 28px rgba(0,0,0,0.08)}
.paper-sheet:first-child{border-radius:12px}
@media(max-width:720px){
.book-nav{flex-direction:column;align-items:flex-start;padding:10px 14px}
.book-nav__controls{width:100%;justify-content:flex-start}
.book-content{padding:0 14px}
.paper-sheet{padding:24px 18px 18px;border-radius:0}
.atlas-grid{grid-template-columns:1fr}
.chapter__title{font-size:1.8rem}
.section-cover,.section-opening{min-height:70vh;padding:18px 0}
.section-cover img,.section-opening img{max-height:70vh}
}
@media print{
.book-nav{position:static;background:#fff;color:#000;border:none;backdrop-filter:none}
.book-nav__eyebrow{color:#666}
.book-nav__title{color:#000}
.nav-counter{background:#eee;color:#333}
.paper-sheet{box-shadow:none;border-radius:0;padding:20px 0}
.chapter{page-break-before:always}
}
`.trim();
}

function buildReaderJS() {
  return `
(function(){
var data=BOOK_DATA;
var strings=data.strings||{};
var app=document.getElementById("app");

function esc(t){return String(t||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}

var chapters=data.chapters||[];
var atlas=data.atlas||{};
var atlasKeys=["characters","places","concepts","themes","relationships","events","special-objects"];
var hasAtlas=atlasKeys.some(function(k){return atlas[k]&&atlas[k].length});

var chapterEls=[];

function buildNav(){
return '<nav class="book-nav">'
+'<div class="book-nav__brand">'
+'<div class="book-nav__eyebrow">'+esc(strings.bookReader||"Book Reader")+'</div>'
+'<div class="book-nav__title">'+esc(data.title)+'</div>'
+'</div>'
+'<div class="book-nav__controls">'
+'<button class="nav-btn" data-scroll="top">&#8593;</button>'
+'<button class="nav-btn" data-scroll="toc">'+esc(strings.openToc||"Contents")+'</button>'
+'<select class="nav-select" data-jump>'+('<option value="">'+esc(strings.jumpToChapter||"Jump to chapter")+'</option>')
+chapters.map(function(ch,i){return '<option value="ch-'+i+'">'+(i+1)+'. '+esc(ch.title)+'</option>'}).join("")+'</select>'
+'</div>'
+'</nav>';
}

function buildCover(){
return '<section class="section-cover" id="sec-cover">'
+'<img src="'+COVER_SRC+'" alt="'+esc(strings.coverAlt||"cover")+'" loading="eager">'
+'</section>';
}

function buildOpening(){
return '<section class="section-opening" id="sec-opening">'
+'<img src="'+OPENING_SRC+'" alt="'+esc(strings.openingAlt||"opening")+'" loading="eager">'
+'</section>';
}

function buildToc(){
return '<section class="section-toc" id="sec-toc">'
+'<div class="paper-sheet">'
+'<h2>'+esc(strings.tableOfContents||"Table of Contents")+'</h2>'
+'<p class="section-toc__sub">'+esc(data.author||"")+(data.genre?' &middot; '+esc(data.genre):"")+'</p>'
+'<div class="toc-list">'
+chapters.map(function(ch,i){
return '<button class="toc-item" data-scroll="ch-'+i+'">'
+'<span class="toc-item__num">'+(i+1)+'</span>'
+'<span class="toc-item__text"><strong>'+esc(ch.title)+'</strong><span>'+(ch.summary?esc(ch.summary.substring(0,140)):"")+'</span></span>'
+'</button>';
}).join("")
+'</div>'
+'</div>'
+'</section>';
}

function buildAtlas(){
if(!hasAtlas)return "";
var panels=atlasKeys.filter(function(k){return atlas[k]&&atlas[k].length}).map(function(k){
var items=atlas[k].slice(0,4);
var label={characters:"Characters",places:"Places",concepts:"Concepts",themes:"Themes",relationships:"Relationships",events:"Events","special-objects":"Special Objects"}[k]||k;
return '<div class="atlas-panel"><h3>'+esc(label)+'</h3><ul>'
+items.map(function(it){return '<li><strong>'+esc(it.title)+'</strong><span>'+esc((it.summary||"").substring(0,100))+'</span></li>'}).join("")
+'</ul></div>';
}).join("");
return '<section class="section-atlas" id="sec-atlas">'
+'<div class="paper-sheet">'
+'<h2>'+esc(strings.worldOverview||"World Overview")+'</h2>'
+'<p class="section-atlas__sub">'+esc(strings.worldOverviewSub||"")+'</p>'
+'<div class="atlas-grid">'+panels+'</div>'
+'</div>'
+'</section>';
}

function buildChapter(ch,i){
return '<section class="chapter" id="ch-'+i+'">'
+'<div class="paper-sheet">'
+'<div class="chapter__header">'
+'<span class="chapter__number">'+esc(strings.chapter||"Chapter")+' '+(i+1)+'</span>'
+'<h2 class="chapter__title">'+esc(ch.title)+'</h2>'
+(ch.summary?'<p class="chapter__summary">'+esc(ch.summary)+'</p>':"")
+'<div class="chapter__divider"></div>'
+'</div>'
+'<div class="chapter__body">'+ch.html+'</div>'
+'<div class="chapter__footer">'
+'<span>'+esc(strings.chapter||"Chapter")+' '+(i+1)+': '+esc(ch.title)+'</span>'
+'<span></span>'
+'</div>'
+'</div>'
+'</section>';
}

function buildClosing(){
return '<section class="section-closing" id="sec-closing">'
+'<div class="paper-sheet" style="text-align:center">'
+'<h2>'+esc(strings.closingTitle||"End of the Book")+'</h2>'
+'<p>'+esc(strings.closingNote||"Thank you for reading.")+'</p>'
+(data.openingQuote?'<blockquote class="closing-quote">'+esc(data.openingQuote)+'</blockquote>':"")
+'</div>'
+'</section>';
}

var html=buildNav()
+'<div class="app-shell">'
+'<div class="book-content">'
+buildCover()
+buildOpening()
+buildToc()
+buildAtlas();

for(var i=0;i<chapters.length;i++){
html+=buildChapter(chapters[i],i);
}

html+=buildClosing()
+'</div>'
+'</div>';

app.innerHTML=html;

app.querySelector("[data-scroll=top]")&&app.querySelector("[data-scroll=top]").addEventListener("click",function(){window.scrollTo({top:0,behavior:"smooth"})});
app.querySelector("[data-scroll=toc]")&&app.querySelector("[data-scroll=toc]").addEventListener("click",function(){var el=document.getElementById("sec-toc");if(el)el.scrollIntoView({behavior:"smooth"})});

app.querySelectorAll("[data-scroll]").forEach(function(btn){
if(btn.getAttribute("data-scroll")==="top"||btn.getAttribute("data-scroll")==="toc")return;
btn.addEventListener("click",function(){
var id=btn.getAttribute("data-scroll");
var el=document.getElementById(id);
if(el)el.scrollIntoView({behavior:"smooth"});
});
});

var jumpSel=app.querySelector("[data-jump]");
if(jumpSel){
jumpSel.addEventListener("change",function(){
if(!jumpSel.value)return;
var el=document.getElementById(jumpSel.value);
if(el)el.scrollIntoView({behavior:"smooth"});
jumpSel.value="";
});
}

var currentChapter=0;
var chSections=app.querySelectorAll(".chapter");

function onScroll(){
var scrollY=window.scrollY||window.pageYOffset;
var best=0;
for(var i=0;i<chSections.length;i++){
var top=chSections[i].getBoundingClientRect().top+scrollY;
if(top-200<=scrollY)best=i;
}
currentChapter=best;
}

window.addEventListener("scroll",onScroll,{passive:true});

document.addEventListener("keydown",function(e){
if(e.key==="ArrowDown"||e.key==="ArrowRight"){
var next=currentChapter+1;
if(next<chSections.length){chSections[next].scrollIntoView({behavior:"smooth"});e.preventDefault();}
}else if(e.key==="ArrowUp"||e.key==="ArrowLeft"){
var prev=currentChapter-1;
if(prev>=0){chSections[prev].scrollIntoView({behavior:"smooth"});e.preventDefault();}
}
});
})();
`.trim();
}

// ─── Main Build ──────────────────────────────────────────────

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
  const consistencyReportPath = path.join(buildDir, "consistency-report.json");
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
  const chapterMetas = [];
  const chapterReports = [];

  const chaptersData = [];

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
    chapterMetas.push({ id: chapterId, dependsOn: planMeta.dependsOn || [] });
    chapterRecords.push({
      id: chapterId,
      title: planMeta.title || chapterId,
      summary: planMeta.summary || "",
      chapterFile: `./chapters/${chapterId}.md`,
      sourcePlanFile: `./specs/chapter-plans/${chapterId}.md`,
    });

    const chapterMarkdown = await readFile(outputPath);
    chaptersData.push({
      id: chapterId,
      title: planMeta.title || chapterId,
      summary: planMeta.summary || "",
      markdown: chapterMarkdown,
    });

    const validationReport = validateChapterContext(await buildChapterContext(bookDir, chapterId));
    chapterReports.push({
      chapterId,
      ...validationReport,
    });
  }

  const sourceSpecGroups = await buildDynamicSpecSourceGroups({ bookDir, specsDir, chapterOrder });
  const consistencyReport = await buildGlobalConsistencyReport({
    bookDir,
    specsDir,
    chapterOrder,
    chapterReports,
    chapterMetas,
  });

  const sourceMaterials = {
    specs: sourceSpecGroups,
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
    consistencyReport: "./build/consistency-report.json",
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
  const consistencyState = await writeIfChanged(consistencyReportPath, JSON.stringify(consistencyReport, null, 2) + "\n");
  const manifestState = await writeIfChanged(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  const htmlShell = buildHtmlShell({
    manifestPath: "./build/manifest.json",
    title: visualSpec.title || "Book Viewer",
  });
  const htmlState = await writeIfChanged(bookHtmlPath, htmlShell);

  // ── Self-contained readers (en + ro) ─────────────────────

  const bookSlug = path.basename(bookDir);
  const workspaceRoot = path.resolve(process.cwd(), "docs");

  const LANG_TRANSLATIONS = {
    ro: {
      title: visualSpec.title,
      subtitle: visualSpec.subtitle,
      author: visualSpec.author,
      genre: visualSpec.genre,
      logline: visualSpec.logline,
      openingQuote: "O mie de ani de etică aleasă. Un accident să-i zdruncine. Întrebarea nu e dacă etica a fost reală — ci dacă o practicăm din nou.",
      openingNote: "Rețeaua-rădăcină a făcut imposibil uciderea. Tehnologia a făcut-o accidental. Hibridul a făcut-o complicată. Și prima moarte într-un milion de ani a făcut-o reală.",
      coverBadge: "Al Doilea Contact",
      openingEyebrow: "Volumul II",
      openingLabel: "Falsa Utopie Dezvelită",
    },
  };

  for (const lang of ["en", "ro"]) {
    const langDir = path.join(workspaceRoot, lang, bookSlug);

    let langChaptersData = chaptersData;
    if (lang === "ro") {
      const chaptersRoDir = path.join(bookDir, "chapters-ro");
      if (await fileExists(chaptersRoDir)) {
        langChaptersData = [];
        for (const ch of chaptersData) {
          const roPath = path.join(chaptersRoDir, ch.id + ".md");
          if (await fileExists(roPath)) {
            const roMarkdown = await readFile(roPath);
            const { data: roData } = parseFrontmatter(roMarkdown);
            langChaptersData.push({
              ...ch,
              title: roData.title || ch.title,
              markdown: roMarkdown,
            });
          } else {
            langChaptersData.push(ch);
          }
        }
      }
    }

    let langVisualSpec = visualSpec;
    if (lang === "ro" && LANG_TRANSLATIONS.ro) {
      const t = LANG_TRANSLATIONS.ro;
      langVisualSpec = {
        ...visualSpec,
        openingQuote: t.openingQuote,
        openingNote: t.openingNote,
        coverBadge: t.coverBadge,
        openingEyebrow: t.openingEyebrow,
        openingLabel: t.openingLabel,
      };
    }

    const langHtml = buildSelfContainedReader({
      manifest,
      visualSpec: langVisualSpec,
      chaptersData: langChaptersData,
      coverPageSvg,
      openingPageSvg,
      lang,
    });
    const state2 = await writeIfChanged(path.join(langDir, "book.html"), langHtml);
    console.log(`Reader (${lang}): ${state2} -> docs/${lang}/${bookSlug}/book.html`);
  }

  state.outputs = {
    coverArt: hashText(coverArtSvg),
    coverPage: hashText(coverPageSvg),
    openingPage: hashText(openingPageSvg),
    consistencyReport: hashText(JSON.stringify(consistencyReport)),
    manifest: hashText(JSON.stringify(manifest)),
    bookHtml: hashText(htmlShell),
  };

  await writeIfChanged(statePath, JSON.stringify(state, null, 2) + "\n");

  console.log(`Built ${metadata.title || targetArg}`);
  console.log(`Cover art: ${coverArtState}`);
  console.log(`Cover page: ${coverPageState}`);
  console.log(`Opening page: ${openingPageState}`);
  console.log(`Consistency report: ${consistencyState} (${consistencyReport.status})`);
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