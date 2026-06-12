// discord-bridge — Haven community bot
//
// A two-way bridge between one Discord channel and one Haven channel.
//
//   Discord -> Haven : a Discord bot account watches a channel and re-posts
//                      each human message into Haven via the bot webhook API,
//                      attributed to the original Discord author (name + avatar).
//   Haven   -> Discord: a Haven bot account connects over Socket.IO, listens
//                      for new messages in the mapped channel, and forwards
//                      each human message to a Discord webhook (name + avatar).
//
// Everything runs on YOUR host. No tokens are sent anywhere except the two
// services you configure. Configuration is via environment variables only.
//
// See README.md for setup.

'use strict';

const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { io } = require('socket.io-client');

// ── Config ─────────────────────────────────────────────────────────────────
const HAVEN_URL          = (process.env.HAVEN_URL || '').replace(/\/+$/, '');
const HAVEN_BOT_USERNAME = process.env.HAVEN_BOT_USERNAME || '';
const HAVEN_BOT_PASSWORD = process.env.HAVEN_BOT_PASSWORD || '';
const HAVEN_CHANNEL_CODE = (process.env.HAVEN_CHANNEL_CODE || '').trim().toLowerCase();
const HAVEN_WEBHOOK_URL  = process.env.HAVEN_WEBHOOK_URL || '';
const DISCORD_BOT_TOKEN  = process.env.DISCORD_BOT_TOKEN || '';
const DISCORD_CHANNEL_ID = (process.env.DISCORD_CHANNEL_ID || '').trim();
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || '';
const INSECURE_TLS       = String(process.env.HAVEN_INSECURE_TLS || 'false').toLowerCase() === 'true';

const required = { HAVEN_URL, HAVEN_BOT_USERNAME, HAVEN_BOT_PASSWORD, HAVEN_CHANNEL_CODE, HAVEN_WEBHOOK_URL, DISCORD_BOT_TOKEN, DISCORD_CHANNEL_ID, DISCORD_WEBHOOK_URL };
const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error('FATAL: missing required env vars: ' + missing.join(', '));
  process.exit(1);
}

// Self-signed Haven instances: allow opting out of TLS verification explicitly.
if (INSECURE_TLS) process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// The Discord webhook id identifies messages WE posted, so we never bridge our
// own Haven->Discord output back into Haven (the loop guard for this leg).
const DISCORD_WEBHOOK_ID = (DISCORD_WEBHOOK_URL.match(/\/webhooks\/(\d+)\//) || [])[1] || '';

// ── Discord -> Haven ───────────────────────────────────────────────────────
const discord = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

discord.once('ready', () => console.log(`[discord] logged in as ${discord.user.tag}, watching channel ${DISCORD_CHANNEL_ID}`));

discord.on('messageCreate', async (msg) => {
  try {
    if (msg.channelId !== DISCORD_CHANNEL_ID) return;
    // Loop guard: ignore the webhook WE post through (Haven->Discord output).
    if (msg.webhookId && msg.webhookId === DISCORD_WEBHOOK_ID) return;
    // Ignore other bots/system messages to keep the bridge human-to-human.
    if (msg.author?.bot) return;
    const content = (msg.content || '').trim();
    const extras = [...msg.attachments.values()].map(a => a.url);
    const body = [content, ...extras].filter(Boolean).join('\n');
    if (!body) return;
    const username = (msg.member?.displayName || msg.author?.username || 'Discord').slice(0, 32);
    const avatar_url = msg.author?.displayAvatarURL?.({ extension: 'png', size: 128 }) || '';
    const resp = await fetch(HAVEN_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: body.slice(0, 4000), username, avatar_url }),
    });
    if (!resp.ok) console.error(`[discord->haven] webhook POST failed: ${resp.status} ${await resp.text().catch(() => '')}`);
  } catch (e) {
    console.error('[discord->haven] error:', e.message);
  }
});

// ── Haven -> Discord ───────────────────────────────────────────────────────
async function havenLogin() {
  const resp = await fetch(`${HAVEN_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: HAVEN_BOT_USERNAME, password: HAVEN_BOT_PASSWORD, eulaVersion: '2.0', ageVerified: true }),
  });
  if (!resp.ok) throw new Error(`Haven login failed: ${resp.status} ${await resp.text().catch(() => '')}`);
  const data = await resp.json();
  const token = data.token || data.jwt || data.accessToken;
  if (!token) throw new Error('Haven login returned no token');
  return { token, userId: data.user?.id ?? data.userId ?? null };
}

async function forwardToDiscord(content, username, avatar_url) {
  const body = { content: content.slice(0, 1900) };
  if (username) body.username = String(username).slice(0, 80);
  if (avatar_url) body.avatar_url = avatar_url;
  const resp = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) console.error(`[haven->discord] webhook POST failed: ${resp.status}`);
}

async function startHaven() {
  let session;
  try {
    session = await havenLogin();
  } catch (e) {
    console.error('[haven] ' + e.message + ' — retrying in 15s');
    return setTimeout(startHaven, 15000);
  }
  const botUserId = session.userId;
  console.log(`[haven] logged in as ${HAVEN_BOT_USERNAME}${botUserId ? ` (id ${botUserId})` : ''}`);

  const socket = io(HAVEN_URL, {
    transports: ['websocket'],
    auth: { token: session.token },
    rejectUnauthorized: !INSECURE_TLS,
    reconnection: true,
  });

  socket.on('connect', () => {
    console.log('[haven] socket connected, entering channel ' + HAVEN_CHANNEL_CODE);
    socket.emit('enter-channel', { code: HAVEN_CHANNEL_CODE });
  });

  socket.on('new-message', (msg) => {
    try {
      const code = (msg.channelCode || msg.channel_code || '').toLowerCase();
      if (code && code !== HAVEN_CHANNEL_CODE) return;
      // Loop guard: skip our own bot account and any webhook-posted message
      // (those are Discord->Haven output and must not bounce back).
      const uid = msg.user_id ?? msg.userId;
      if (botUserId != null && uid === botUserId) return;
      if (msg.is_webhook === true || msg.is_webhook === 1 || msg.isWebhook === true) return;
      const content = (msg.content || '').trim();
      if (!content) return;
      const username = msg.displayName || msg.username || 'Haven';
      let avatar = msg.avatar || null;
      if (avatar && !/^https?:\/\//i.test(avatar)) avatar = HAVEN_URL + avatar;
      forwardToDiscord(content, username, avatar);
    } catch (e) {
      console.error('[haven->discord] error:', e.message);
    }
  });

  socket.on('disconnect', (reason) => console.log('[haven] socket disconnected: ' + reason));
  socket.on('connect_error', (e) => console.error('[haven] connect_error: ' + e.message));
}

// ── Boot ───────────────────────────────────────────────────────────────────
discord.login(DISCORD_BOT_TOKEN).catch((e) => {
  console.error('FATAL: Discord login failed: ' + e.message);
  process.exit(1);
});
startHaven();

process.on('SIGINT', () => { console.log('shutting down'); process.exit(0); });
