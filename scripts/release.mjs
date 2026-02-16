#!/usr/bin/env node
/**
 * Per-package release script. Run via: pnpm --filter <package> run release <patch|minor|prod>
 * Requires: main branch, clean tree, synced with origin/main. Claude (claude CLI) for release notes.
 */

import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const VALID_COMMANDS = new Set(['patch', 'minor', 'prod']);
const SCOPE = '@codygo-ai/';
const RELEASE_NOTES_FILE = 'release-notes.md';

function exec(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf-8', ...opts });
}

function execInRoot(cmd, root) {
  return exec(cmd, { cwd: root });
}

function getRepoRoot() {
  return exec('git rev-parse --show-toplevel').trim();
}

function parseArgs() {
  const arg = process.argv[2];
  if (!arg || !VALID_COMMANDS.has(arg)) {
    console.error('Usage: release <patch|minor|prod>');
    console.error('Run via: pnpm --filter <package> run release <patch|minor|prod>');
    process.exit(1);
  }
  return arg;
}

function guards(root) {
  const branch = execInRoot('git rev-parse --abbrev-ref HEAD', root).trim();
  if (branch !== 'main') {
    console.error('Release only allowed on branch main. Current branch:', branch);
    process.exit(1);
  }
  const status = execInRoot('git status --porcelain', root).trim();
  if (status) {
    console.error('Working tree must be clean. Uncommitted changes:\n', status);
    process.exit(1);
  }
  execInRoot('git fetch origin', root);
  const head = execInRoot('git rev-parse HEAD', root).trim();
  const originMain = execInRoot('git rev-parse origin/main', root).trim();
  if (head !== originMain) {
    console.error('HEAD must match origin/main. Run git pull and try again.');
    process.exit(1);
  }
}

function resolvePackage(pkgDir) {
  const pkgPath = join(pkgDir, 'package.json');
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  } catch (e) {
    console.error('Could not read package.json at', pkgPath, e.message);
    process.exit(1);
  }
  const name = pkg.name;
  if (!name || !name.startsWith(SCOPE)) {
    console.error('Package name must be under scope', SCOPE, 'got', name);
    process.exit(1);
  }
  const slug = name.slice(SCOPE.length);
  const version = (pkg.version || '').trim();
  if (!version) {
    console.error('Package version is missing in package.json');
    process.exit(1);
  }
  return { name, slug, version, pkgPath, pkg };
}

function parseVersion(version) {
  const prodMatch = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (prodMatch) {
    return { major: +prodMatch[1], minor: +prodMatch[2], patch: +prodMatch[3], alpha: false };
  }
  const alphaMatch = version.match(/^(\d+)\.(\d+)\.(\d+)-alpha$/);
  if (alphaMatch) {
    return { major: +alphaMatch[1], minor: +alphaMatch[2], patch: +alphaMatch[3], alpha: true };
  }
  return undefined;
}

function computeNextVersion(current, command) {
  const v = parseVersion(current);
  if (!v) {
    console.error('Invalid version format (expected X.Y.Z or X.Y.Z-alpha):', current);
    process.exit(1);
  }

  if (command === 'prod') {
    if (!v.alpha) {
      console.error('prod is only allowed when current version is alpha. Current:', current);
      process.exit(1);
    }
    return `${v.major}.${v.minor}.${v.patch}`;
  }

  if (command === 'minor') {
    return `${v.major}.${v.minor + 1}.0-alpha`;
  }

  if (command === 'patch') {
    if (v.alpha) {
      return `${v.major}.${v.minor}.${v.patch + 1}-alpha`;
    }
    console.error('patch is only allowed when current version is alpha. Current:', current);
    process.exit(1);
  }

  throw new Error('Unreachable');
}

function getPreviousTag(root, slug) {
  try {
    const out = execInRoot(`git tag -l '${slug}/v*'`, root).trim();
    if (!out) return undefined;
    const tags = out.split(/\n/).filter(Boolean);
    if (tags.length === 0) return undefined;
    const withVersion = tags
      .map((t) => {
        const m = t.match(/^(.+)\/v(\d+\.\d+\.\d+)(-alpha)?$/);
        return m ? { tag: t, ver: m[2] + (m[3] || '') } : undefined;
      })
      .filter(Boolean);
    if (withVersion.length === 0) return undefined;
    withVersion.sort((a, b) => compareSemver(a.ver, b.ver));
    return withVersion[withVersion.length - 1].tag;
  } catch {
    return undefined;
  }
}

function compareSemver(a, b) {
  const pa = a
    .replace(/-alpha$/, '.0')
    .split('.')
    .map(Number);
  const pb = b
    .replace(/-alpha$/, '.0')
    .split('.')
    .map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return (a.endsWith('-alpha') ? 0 : 1) - (b.endsWith('-alpha') ? 0 : 1);
}

function generateReleaseNotes(root, pkgDir, slug, newVersion, previousTag) {
  const range = previousTag ? `${previousTag}..HEAD` : 'HEAD';
  const relDir = relative(root, pkgDir);
  let log = '';
  try {
    log = execInRoot(`git log ${range} --pretty=format:"%h %s" -- "${relDir}"`, root).trim();
  } catch {
    log = execInRoot(`git log ${range} --pretty=format:"%h %s"`, root).trim();
  }
  const prompt = `You are generating release notes for an npm package release.

Package: @codygo-ai/${slug}
New version: ${newVersion}
Previous tag: ${previousTag || '(none)'}

Recent commits (package or repo):
${log || '(no commits)'}

Write concise release notes in Markdown: a short title line, then a bullet list of changes. No preamble. Output only the release notes.`;

  const claudeResult = spawnSync('claude', ['--print'], {
    input: prompt,
    encoding: 'utf-8',
    shell: true,
  });

  if (claudeResult.error) {
    console.error(
      'Claude is required to generate release notes. Ensure the Claude CLI is installed and in PATH.'
    );
    console.error('Error:', claudeResult.error.message);
    process.exit(1);
  }
  if (claudeResult.status !== 0) {
    console.error('Claude exited with code', claudeResult.status);
    if (claudeResult.stderr) console.error(claudeResult.stderr);
    process.exit(1);
  }

  const notes = (claudeResult.stdout || '').trim();
  if (!notes) {
    console.error('Claude produced empty release notes.');
    process.exit(1);
  }

  const notesPath = join(pkgDir, RELEASE_NOTES_FILE);
  writeFileSync(notesPath, notes, 'utf-8');
  return notesPath;
}

function main() {
  const command = parseArgs();
  const pkgDir = process.cwd();
  const root = getRepoRoot();

  guards(root);

  const { name, slug, version, pkgPath, pkg } = resolvePackage(pkgDir);
  const newVersion = computeNextVersion(version, command);

  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, undefined, 2) + '\n', 'utf-8');

  const previousTag = getPreviousTag(root, slug);
  const notesPath = generateReleaseNotes(root, pkgDir, slug, newVersion, previousTag);
  const notesRelative = relative(root, notesPath);

  const commitMessage = `chore(release): ${slug} v${newVersion}`;
  const relPkg = relative(root, pkgPath);
  const relNotes = relative(root, notesPath);
  execInRoot(`git add "${relPkg}" "${relNotes}"`, root);
  execInRoot(`git commit -m "${commitMessage}"`, root);
  execInRoot('git push origin main', root);

  const tagName = `${slug}/v${newVersion}`;
  execInRoot(`git tag ${tagName}`, root);
  execInRoot(`git push origin ${tagName}`, root);

  console.log('Released:', name, 'v' + version, '->', 'v' + newVersion);
  console.log('Release notes:', notesRelative);
  console.log('Committed and pushed main; tag', tagName, 'pushed.');
}

main();
