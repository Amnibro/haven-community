// github-releases — Haven community bot
//
// Listens for GitHub release webhooks, verifies the signature, and posts a
// formatted summary into a Haven channel via the bot webhook API.
//
// See README.md for setup. Configuration is via environment variables only;
// nothing is read from disk except the source itself.

'use strict';

const crypto = require('crypto');
const express = require('express');

// ── Config ─────────────────────────────────────────────────────────────────
const HAVEN_WEBHOOK_URL    = process.env.HAVEN_WEBHOOK_URL;
const GITHUB_SECRET        = process.env.GITHUB_WEBHOOK_SECRET;
const HAVEN_USERNAME       = process.env.HAVEN_USERNAME || '';
const HAVEN_AVATAR_URL     = process.env.HAVEN_AVATAR_URL || '';
const REPO_FILTER          = (process.env.REPO_FILTER || '').trim().toLowerCase();
const INCLUDE_PRERELEASES  = String(process.env.INCLUDE_PRERELEASES || 'false').toLowerCase() === 'true';
const INCLUDE_DRAFTS       = String(process.env.INCLUDE_DRAFTS || 'false').toLowerCase() === 'true';
const BODY_MAX_CHARS       = Math.max(0, parseInt(process.env.BODY_MAX_CHARS || '1500', 10) || 1500);
const PORT                 = parseInt(process.env.PORT || '3000', 10);

if (!HAVEN_WEBHOOK_URL || !GITHUB_SECRET) {
  console.error('FATAL: HAVEN_WEBHOOK_URL and GITHUB_WEBHOOK_SECRET are both required.');
  process.exit(1);
}

// ── HMAC verification ──────────────────────────────────────────────────────
// GitHub sends the signature in the X-Hub-Signature-256 header as
// "sha256=<hex>". We must compute the same HMAC over the raw request body
// (NOT the parsed JSON) and timing-safe-compare.
function verifySignature(rawBody, headerValue) {
  if (!headerValue || !headerValue.startsWith('sha256=')) return false;
  const expected = crypto
    .createHmac('sha256', GITHUB_SECRET)
    .update(rawBody)
    .digest('hex');
  const provided = headerValue.slice(7);
  // Length check first so timingSafeEqual doesn't throw on mismatched buffers
  if (provided.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

// ── Message formatter ──────────────────────────────────────────────────────
function buildMessage(payload) {
  const rel = payload.release || {};
  const repo = payload.repository || {};

  const tag       = rel.tag_name || rel.name || 'untagged';
  const name      = rel.name || tag;
  const url       = rel.html_url || repo.html_url || '';
  const repoFull  = repo.full_name || 'unknown/unknown';
  const author    = (rel.author && rel.author.login) ? rel.author.login : '';
  const prerelease = !!rel.prerelease;
  const draft      = !!rel.draft;

  const headerIcon = prerelease ? '🧪' : draft ? '📝' : '🚀';
  const kind = prerelease ? 'pre-release' : draft ? 'draft' : 'release';

  // Truncate body
  let body = (rel.body || '').trim();
  if (BODY_MAX_CHARS > 0 && body.length > BODY_MAX_CHARS) {
    body = body.slice(0, BODY_MAX_CHARS).trimEnd() + '\n\n… (see GitHub for full notes)';
  }

  const lines = [];
  lines.push(`${headerIcon} **New ${kind}: ${repoFull} ${name}**`);
  if (url) lines.push(url);
  if (author) lines.push(`_Published by @${author}_`);
  if (body) {
    lines.push('');
    lines.push(body);
  }
  return lines.join('\n');
}

// ── Haven POST ─────────────────────────────────────────────────────────────
async function postToHaven(content) {
  const body = { content };
  if (HAVEN_USERNAME)   body.username = HAVEN_USERNAME;
  if (HAVEN_AVATAR_URL) body.avatar_url = HAVEN_AVATAR_URL;

  const res = await fetch(HAVEN_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Haven responded ${res.status}: ${text.slice(0, 300)}`);
  }
}

// ── Server ─────────────────────────────────────────────────────────────────
const app = express();

// We need the raw body for HMAC verification, so capture it before parsing.
app.use('/github', express.raw({ type: '*/*', limit: '2mb' }));

app.get('/', (_req, res) => {
  res.type('text/plain').send('github-releases bot is running. POST GitHub release webhooks to /github.');
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/github', async (req, res) => {
  const sig   = req.get('X-Hub-Signature-256');
  const event = (req.get('X-GitHub-Event') || '').toLowerCase();
  const raw   = req.body; // Buffer

  if (!verifySignature(raw, sig)) {
    console.warn(`[${new Date().toISOString()}] rejected: bad signature (event=${event})`);
    return res.status(401).json({ error: 'invalid signature' });
  }

  if (event === 'ping') return res.json({ pong: true });
  if (event !== 'release') return res.json({ ignored: `event=${event}` });

  let payload;
  try {
    payload = JSON.parse(raw.toString('utf8'));
  } catch {
    return res.status(400).json({ error: 'invalid JSON' });
  }

  const action = payload.action || '';
  const rel    = payload.release || {};
  const repo   = payload.repository || {};

  // Only fire on first publication, not every edit/delete.
  // GitHub sends `published` for normal releases, `prereleased` for pre-releases,
  // and `created` for drafts. Everything else (edited, deleted, released) is noise.
  const accept =
    action === 'published' ||
    (action === 'prereleased' && INCLUDE_PRERELEASES) ||
    (action === 'created'     && INCLUDE_DRAFTS && rel.draft);
  if (!accept) {
    return res.json({ ignored: `action=${action}` });
  }

  if (REPO_FILTER && (repo.full_name || '').toLowerCase() !== REPO_FILTER) {
    return res.json({ ignored: `repo=${repo.full_name}` });
  }

  const message = buildMessage(payload);
  try {
    await postToHaven(message);
    console.log(`[${new Date().toISOString()}] posted: ${repo.full_name} ${rel.tag_name}`);
    res.json({ ok: true });
  } catch (err) {
    console.error(`[${new Date().toISOString()}] post failed:`, err.message);
    res.status(502).json({ error: 'failed to post to Haven', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`github-releases bot listening on :${PORT}`);
  if (REPO_FILTER) console.log(`  filtering to repo: ${REPO_FILTER}`);
  console.log(`  pre-releases: ${INCLUDE_PRERELEASES ? 'on' : 'off'}, drafts: ${INCLUDE_DRAFTS ? 'on' : 'off'}`);
});
