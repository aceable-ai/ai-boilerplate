#!/usr/bin/env node
// Creates .claude/skills/<name> → ../../.agents/skills/<name> symlinks.
// Runs on every `npm install` via postinstall. Safe to re-run (idempotent).
// Uses directory junctions on Windows (no admin/Developer Mode required).

'use strict';
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const skillsSrc = path.join(root, '.agents', 'skills');
const skillsDst = path.join(root, '.claude', 'skills');

if (!fs.existsSync(skillsSrc)) process.exit(0);

fs.mkdirSync(skillsDst, { recursive: true });

const isWindows = process.platform === 'win32';
const linkType = isWindows ? 'junction' : 'dir';

let created = 0;
for (const name of fs.readdirSync(skillsSrc)) {
  const src = path.join(skillsSrc, name);
  const dst = path.join(skillsDst, name);
  const rel = path.relative(path.dirname(dst), src);

  if (!fs.statSync(src).isDirectory()) continue;

  try {
    const existing = fs.lstatSync(dst);
    if (existing.isSymbolicLink() || (isWindows && existing.isDirectory())) {
      continue; // already linked
    }
    fs.rmSync(dst, { recursive: true });
  } catch {
    // dst doesn't exist — fall through to create
  }

  fs.symlinkSync(isWindows ? src : rel, dst, linkType);
  created++;
}

if (created > 0) console.log(`linked ${created} skill(s) → .claude/skills/`);
