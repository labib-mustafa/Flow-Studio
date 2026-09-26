#!/usr/bin/env node
/**
 * Design-token guard.
 *
 * Catches the two colour bug classes that bulk edits to this codebase keep
 * producing, both of which fail silently at runtime:
 *
 *   1. Nonexistent shades  - `border-slate-350`, `text-blue-650`, `bg-blue-605`.
 *      Tailwind only generates the hundreds (50..950), so these render nothing.
 *   2. Malformed opacity   - `bg-accent/50/10`, produced when a bulk regex turns
 *      `bg-blue-500/10` into something with two slashes.
 *
 * Plus one drift check: a colour utility that extends a declared `@theme` token
 * with a suffix that does not exist (`primary-dark` when only `--color-primary`
 * and `--color-primary-hover` are declared).
 *
 * Only `src/index.css` `@theme` declares tokens. Keep it that way.
 *
 * Usage: node scripts/check-design-tokens.cjs
 * Exit 1 on any finding.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const THEME_FILE = path.join(ROOT, 'src', 'index.css');
const SCAN_ROOT = path.join(ROOT, 'src');

// Tailwind default palette. Shades are the hundreds only.
const FAMILIES = new Set([
  'slate', 'gray', 'zinc', 'neutral', 'stone',
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
]);
const SHADES = new Set([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);

// Utilities that take a colour, i.e. the prefixes worth inspecting.
const COLOUR_PREFIXES = [
  'bg', 'text', 'border', 'ring', 'ring-offset', 'from', 'via', 'to', 'divide',
  'outline', 'decoration', 'shadow', 'fill', 'stroke', 'caret', 'accent', 'placeholder',
];

const SHADE_RE = new RegExp(
  `^(?:${COLOUR_PREFIXES.join('|')})-([a-z]+)-(\\d+)(?:\\/\\d+)?$`,
);
const DOUBLE_OPACITY_RE = /^(?:[a-z]+-)+[a-z0-9-]+\/\d+\/\d+$/;
const TOKEN_SPLIT = /[\s"'`{}()<>,;=]+/;

// Longest first, so `ring-offset` wins over `ring`.
const PREFIXES_DESC = [...COLOUR_PREFIXES].sort((a, b) => b.length - a.length);

/** Strip the leading colour prefix so `accent-accent` yields colour `accent`. */
function colourBody(base) {
  for (const p of PREFIXES_DESC) {
    if (base.startsWith(`${p}-`)) return base.slice(p.length + 1);
  }
  return null;
}

function declaredTokens() {
  const css = fs.readFileSync(THEME_FILE, 'utf8');
  const start = css.indexOf('@theme');
  if (start === -1) return new Set();
  const open = css.indexOf('{', start);
  const close = css.indexOf('\n}', open);
  const body = css.slice(open, close === -1 ? undefined : close);
  const tokens = new Set();
  for (const m of body.matchAll(/--color-([a-z0-9-]+)\s*:/g)) tokens.add(m[1]);
  return tokens;
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

const tokens = declaredTokens();
const findings = [];

for (const file of walk(SCAN_ROOT)) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const raw of line.split(TOKEN_SPLIT)) {
      if (!raw) continue;
      const base = raw.split(':').pop().replace(/^!/, '');
      if (!base) continue;

      if (DOUBLE_OPACITY_RE.test(base)) {
        findings.push({ file, line: i + 1, cls: base, why: 'malformed opacity: two "/" segments' });
        continue;
      }

      const shade = SHADE_RE.exec(base);
      if (shade) {
        const [, family, digits] = shade;
        if (FAMILIES.has(family) && !SHADES.has(Number(digits))) {
          findings.push({ file, line: i + 1, cls: base, why: `no such shade: ${family}-${digits}` });
        }
        continue;
      }

      const body = colourBody(base.split('/')[0]);
      if (body === null || body.includes('[') || tokens.has(body)) continue;
      // A declared token extended by characters is drift: e.g. `primary-dark`
      // when only `primary` and `primary-hover` exist.
      const drifted = [...tokens].find((t) => body.startsWith(`${t}-`) && body.length > t.length + 1);
      if (drifted) {
        findings.push({ file, line: i + 1, cls: base, why: `"${drifted}" has no "${body.slice(drifted.length + 1)}" variant` });
      }
    }
  });
}

if (findings.length === 0) {
  console.log(`check-design-tokens: OK (${tokens.size} theme tokens, no invalid colour utilities)`);
  process.exit(0);
}

console.log(`check-design-tokens: ${findings.length} problem(s)\n`);
for (const f of findings) {
  console.log(`  ${path.relative(ROOT, f.file)}:${f.line}`);
  console.log(`    ${f.cls}  ->  ${f.why}`);
}
process.exit(1);
