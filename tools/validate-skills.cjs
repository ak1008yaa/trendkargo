#!/usr/bin/env node
/**
 * validate-skills.cjs
 * Lightweight equivalent of the official quick_validate.py (skill-creator).
 * Validates the YAML frontmatter of SKILL.md files for the installed-skills format.
 *
 * Usage: node tools/validate-skills.cjs <skill-directory> [more dirs...]
 * Exits 0 if all valid, 1 otherwise.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ALLOWED_PROPERTIES = new Set([
  "name",
  "description",
  "license",
  "allowed-tools",
  "metadata",
  "compatibility",
]);

/**
 * Minimal YAML frontmatter parser. Handles:
 *  - simple `key: inline value` scalars
 *  - `key: >-` (folded scalar) with indented continuation lines
 * Nested structures (metadata) are accepted as opaque blocks.
 */
function parseFrontmatter(text) {
  const data = {};
  const lines = text.split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      i++;
      continue;
    }
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) {
      // Unknown structure - accept as part of a nested block (opaque).
      i++;
      continue;
    }
    const key = match[1];
    const rest = match[2];
    if (rest === ">-" || rest === "|") {
      // Folded / literal block: collect subsequent indented lines.
      const blockLines = [];
      let j = i + 1;
      while (j < lines.length && /^[ \t]/.test(lines[j])) {
        blockLines.push(lines[j].trim());
        j++;
      }
      data[key] = rest === "|" ? blockLines.join("\n") : blockLines.join(" ");
      i = j;
    } else {
      data[key] = rest.trim();
      i++;
    }
  }
  return data;
}

function validateSkill(skillPath) {
  const skillPathResolved = path.resolve(skillPath);
  const skillMd = path.join(skillPathResolved, "SKILL.md");
  if (!fs.existsSync(skillMd)) {
    return [false, `SKILL.md not found in ${skillPathResolved}`];
  }
  const content = fs.readFileSync(skillMd, "utf8");
  if (!content.startsWith("---")) {
    return [false, "No YAML frontmatter found"];
  }
  const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!fmMatch) {
    return [false, "Invalid frontmatter format"];
  }
  const frontmatter = parseFrontmatter(fmMatch[1]);

  const unexpected = Object.keys(frontmatter).filter((k) => !ALLOWED_PROPERTIES.has(k));
  if (unexpected.length) {
    return [
      false,
      `Unexpected key(s) in frontmatter: ${unexpected.join(", ")}. Allowed: ${[...ALLOWED_PROPERTIES].join(", ")}`,
    ];
  }

  const name = frontmatter.name;
  if (name === undefined) return [false, "Missing 'name' in frontmatter"];
  if (typeof name !== "string" || name.trim() === "") return [false, "Name must be a non-empty string"];
  if (!/^[a-z0-9-]+$/.test(name)) return [false, `Name '${name}' should be kebab-case (lowercase, digits, hyphens only)`];
  if (name.startsWith("-") || name.endsWith("-") || name.includes("--"))
    return [false, `Name '${name}' cannot start/end with hyphen or contain consecutive hyphens`];
  if (name.length > 64) return [false, `Name too long (${name.length} chars), max 64`];

  const description = frontmatter.description;
  if (description === undefined) return [false, "Missing 'description' in frontmatter"];
  const desc = description.trim();
  if (desc.includes("<") || desc.includes(">"))
    return [false, "Description cannot contain angle brackets (< or >)"];
  if (desc.length > 1024) return [false, `Description too long (${desc.length} chars), max 1024`];

  return [true, "Skill is valid!"];
}

const dirs = process.argv.slice(2);
if (dirs.length === 0) {
  console.error("Usage: node validate-skills.cjs <skill-directory> [more dirs...]");
  process.exit(1);
}

let allValid = true;
for (const dir of dirs) {
  const [valid, message] = validateSkill(dir);
  const status = valid ? "PASS" : "FAIL";
  console.log(`[${status}] ${dir}`);
  console.log(`        ${message}`);
  if (!valid) allValid = false;
}

process.exit(allValid ? 0 : 1);
