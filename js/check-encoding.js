"use strict";

const fs   = require("fs");
const path = require("path");

// ─── Config ──────────────────────────────────────────────────────────────────

const BASE_DIR = path.resolve(__dirname, "..");

const TARGET_FILES = [
  "main-furniture.html",
  "loft-collection.html",
  "office-furniture.html",
  "lighting.html",
  "decoration.html",
];

// Each entry: { label, pattern, replacement }
// Patterns use a capture group prefix ($1) so only the content is replaced,
// leaving the surrounding HTML attributes completely intact.
const FIXES = [
  {
    label: "Remove U+FFFD replacement characters",
    pattern: /\uFFFD/g,
    replacement: "",
  },
  {
    label: 'Fix data-i18n="pqv_guarantee_2y" content',
    pattern: /(data-i18n="pqv_guarantee_2y">)[^<]+/g,
    replacement: "$12 წლის გარანტია",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Count '?' characters that are NOT part of a valid URL query string.
 * URL query '?' is always followed immediately by a letter then word chars
 * (e.g. ?family=, ?auto=, ?w=, ?q=, ?fit=).
 */
function countSuspectQ(content) {
  const withoutUrlQ = content.replace(/\?[a-zA-Z][a-zA-Z0-9_]*/g, "");
  return (withoutUrlQ.match(/\?/g) || []).length;
}

/**
 * Produce a minimal line-level diff between two strings.
 * Returns an array of { lineNo, before, after } for every changed line.
 */
function lineDiff(before, after) {
  const bLines = before.split("\n");
  const aLines = after.split("\n");
  const diffs  = [];
  const len    = Math.max(bLines.length, aLines.length);
  for (let i = 0; i < len; i++) {
    if (bLines[i] !== aLines[i]) {
      diffs.push({ lineNo: i + 1, before: bLines[i] ?? "", after: aLines[i] ?? "" });
    }
  }
  return diffs;
}

function trunc(str, n = 90) {
  const trimmed = str.trim();
  return trimmed.length > n ? trimmed.slice(0, n) + "…" : trimmed;
}

// ─── Core fix logic ───────────────────────────────────────────────────────────

function fixFile(filePath) {
  const original = fs.readFileSync(filePath, "utf8");
  let content    = original;

  const fffdInOriginal = original.includes("\uFFFD");
  const appliedFixes   = [];

  for (const { label, pattern, replacement } of FIXES) {
    pattern.lastIndex = 0;
    const before = content;
    content = content.replace(pattern, replacement);
    if (content !== before) {
      // Count and collect samples from the original (pre-fix) content
      pattern.lastIndex = 0;
      const matches = before.match(pattern) ?? [];
      // For display, strip the capture-group prefix ($1) from each sample
      const samples = [...new Set(matches)]
        .slice(0, 2)
        .map(s => s.replace(/^[^>]+>/, "")); // drop "attr=...>" prefix if present
      appliedFixes.push({ label, count: matches.length, samples });
    }
  }

  const changed = content !== original;
  if (changed) {
    fs.writeFileSync(filePath, content, "utf8");
  }

  return {
    changed,
    fffdInOriginal,
    appliedFixes,
    diffs:    changed ? lineDiff(original, content) : [],
    totalQ:   (content.match(/\?/g) || []).length,
    suspectQ: countSuspectQ(content),
  };
}

// ─── Reporting ────────────────────────────────────────────────────────────────

function printReport(file, r) {
  const HR  = "─".repeat(62);
  const OK  = "✅";
  const ERR = "❌";
  const FIX = "🔧";
  const WRN = "⚠️ ";

  console.log(`\n${HR}`);
  console.log(`📄  ${file}`);
  console.log(HR);

  // U+FFFD
  if (r.fffdInOriginal) {
    console.log(`  ${FIX} U+FFFD replacement chars found and removed`);
  } else {
    console.log(`  ${OK} No U+FFFD replacement chars`);
  }

  // Applied fixes
  if (r.appliedFixes.length > 0) {
    console.log(`\n  Fixes applied (${r.appliedFixes.length}):`);
    for (const fix of r.appliedFixes) {
      console.log(`    ✔  ${fix.label}  [${fix.count}×]`);
      // Show sample before-values for non-FFFD fixes
      if (!fix.label.includes("U+FFFD")) {
        for (const s of fix.samples) {
          console.log(`       before: "${trunc(s, 70)}"`);
        }
      }
    }
  } else {
    console.log(`\n  ${OK} No fixes needed`);
  }

  // '?' count
  console.log(`\n  '?' characters:`);
  console.log(`    Total (incl. URLs) : ${r.totalQ}`);
  if (r.suspectQ === 0) {
    console.log(`    Suspect (non-URL)  : 0  ${OK}`);
  } else {
    console.log(`    Suspect (non-URL)  : ${r.suspectQ}  ${WRN} may still contain corrupted text`);
  }

  // Diff
  if (r.diffs.length > 0) {
    const shown = r.diffs.slice(0, 8);
    console.log(`\n  Changed lines (${r.diffs.length} total):`);
    for (const d of shown) {
      console.log(`    L${String(d.lineNo).padEnd(5)} − ${trunc(d.before, 80)}`);
      console.log(`    ${" ".repeat(6)} + ${trunc(d.after, 80)}`);
    }
    if (r.diffs.length > 8) {
      console.log(`    … and ${r.diffs.length - 8} more line(s)`);
    }
  }

  if (r.changed) {
    console.log(`\n  💾 Saved as UTF-8`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║          HTML Encoding Fixer — Loft Line Site               ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log(`\nBase: ${BASE_DIR}\n`);

let totalModified = 0;

for (const file of TARGET_FILES) {
  const filePath = path.join(BASE_DIR, file);
  if (!fs.existsSync(filePath)) {
    console.log(`\n⚠️  Not found: ${file} — skipped`);
    continue;
  }
  const result = fixFile(filePath);
  printReport(file, result);
  if (result.changed) totalModified++;
}

console.log(`\n${"═".repeat(62)}`);
console.log(`Done. ${totalModified} of ${TARGET_FILES.length} file(s) modified.`);