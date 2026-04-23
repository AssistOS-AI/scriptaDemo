import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export function hashText(text) {
  return crypto.createHash("sha256").update(String(text)).digest("hex");
}

export async function readFile(filePath) {
  return fs.readFile(filePath, "utf8");
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function writeIfMissing(filePath, content) {
  if (await fileExists(filePath)) {
    return "skipped";
  }

  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
  return "created";
}

export async function writeIfChanged(filePath, content) {
  if (await fileExists(filePath)) {
    const current = await readFile(filePath);
    if (current === content) {
      return "unchanged";
    }
  }

  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
  return "updated";
}

export async function listMarkdownFiles(dirPath) {
  if (!(await fileExists(dirPath))) {
    return [];
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => path.join(dirPath, entry.name))
    .sort();
}

export async function listSubdirectories(dirPath) {
  if (!(await fileExists(dirPath))) {
    return [];
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export function slugify(text) {
  return String(text || "")
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function titleFromSlug(slug) {
  return String(slug || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function parseScalar(rawValue) {
  const value = rawValue.trim().replace(/^['"]|['"]$/g, "");

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }

  return value;
}

export function parseSimpleYaml(raw) {
  const data = {};
  const lines = String(raw || "").replace(/\r/g, "").split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    const match = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!match) {
      index += 1;
      continue;
    }

    const [, key, rawValue = ""] = match;
    if (!rawValue.trim()) {
      const items = [];
      index += 1;
      while (index < lines.length && /^\s*-\s+/.test(lines[index])) {
        items.push(parseScalar(lines[index].replace(/^\s*-\s+/, "")));
        index += 1;
      }
      data[key] = items;
      continue;
    }

    data[key] = parseScalar(rawValue);
    index += 1;
  }

  return data;
}

function quoteYamlString(value) {
  const text = String(value ?? "");
  if (!text) {
    return '""';
  }

  if (/^[A-Za-z0-9_.:/@+-]+$/.test(text)) {
    return text;
  }

  return JSON.stringify(text);
}

export function stringifyYaml(data) {
  return Object.entries(data)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        if (!value.length) {
          return `${key}: []`;
        }

        return `${key}:\n${value.map((item) => `  - ${quoteYamlString(item)}`).join("\n")}`;
      }

      return `${key}: ${quoteYamlString(value)}`;
    })
    .join("\n");
}

export function buildFrontmatter(data) {
  return `---\n${stringifyYaml(data)}\n---\n`;
}

export function parseFrontmatter(markdown) {
  if (!String(markdown || "").startsWith("---\n")) {
    return { data: {}, body: String(markdown || "") };
  }

  const endIndex = markdown.indexOf("\n---\n", 4);
  if (endIndex === -1) {
    return { data: {}, body: String(markdown || "") };
  }

  const frontmatter = markdown.slice(4, endIndex);
  const body = markdown.slice(endIndex + 5);
  return { data: parseSimpleYaml(frontmatter), body };
}

export function extractTitle(markdownBody) {
  const match = String(markdownBody || "").match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "Untitled";
}

export function extractSummary(markdownBody) {
  const lines = String(markdownBody || "").replace(/\r/g, "").split("\n");
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

    if (/^#{1,6}\s+/.test(line)) {
      continue;
    }

    paragraph.push(line.trim());
  }

  return paragraph.join(" ");
}

export function extractFirstQuote(markdownBody) {
  const lines = String(markdownBody || "").replace(/\r/g, "").split("\n");
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

export function extractGeneratedDraft(planBody) {
  const match = String(planBody || "").match(/\n## Generated Draft\s*\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Missing '## Generated Draft' section.");
  }

  return match[1].trim() + "\n";
}

export function splitManagedPlanBody(planBody) {
  const body = String(planBody || "");
  const marker = "\n## Generated Draft\n";

  if (body.includes(marker)) {
    const index = body.indexOf(marker);
    return {
      beforeDraft: body.slice(0, index).trimEnd(),
      draftSection: body.slice(index + 1),
    };
  }

  return {
    beforeDraft: body.trimEnd(),
    draftSection: "## Generated Draft\n\n# Draft Title\n\nWrite the draft here.\n",
  };
}

function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function replaceOrAppendSection(markdownBody, heading, sectionContent) {
  const body = String(markdownBody || "");
  const replacement = `## ${heading}\n\n${String(sectionContent || "").trim()}\n`;
  const pattern = new RegExp(`(^|\\n)## ${escapeRegex(heading)}\\s*\\n[\\s\\S]*?(?=\\n## |$)`, "m");

  if (pattern.test(body)) {
    return body.replace(pattern, (match, prefix) => `${prefix}${replacement}`);
  }

  const generatedDraftIndex = body.indexOf("\n## Generated Draft\n");
  if (generatedDraftIndex !== -1) {
    const before = body.slice(0, generatedDraftIndex).trimEnd();
    const after = body.slice(generatedDraftIndex + 1);
    return `${before}\n\n${replacement}\n${after}`;
  }

  return `${body.trimEnd()}\n\n${replacement}`;
}

export function countWords(text) {
  const words = String(text || "").trim().match(/\b[\p{L}\p{N}'-]+\b/gu);
  return words ? words.length : 0;
}

export function normalizeForSearch(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeXml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function toBrowserPath(bookDir, filePath) {
  return `./${path.relative(bookDir, filePath).replace(/\\/g, "/")}`;
}
