# discord-bridge

A two-way bridge between **one Discord channel** and **one Haven channel**. Messages posted by humans on either side appear on the other, attributed to the original author's name and avatar.

```
   Discord #general  ⇄  Haven #general
   alice (Discord)  ───────────▶  alice  (in Haven, via webhook persona)
   bob   (Haven)    ◀───────────  bob    (in Discord, via webhook)
```

This is the standard way to let a Discord community try Haven without leaving Discord: they keep chatting where they are, the conversation is mirrored both ways, and the people who prefer Haven's privacy / self-hosting / mobile app gradually move over. It's an **on-ramp**, not a lock-in.

## How it works

- **Discord → Haven:** a Discord **bot account** watches the mapped channel and re-posts each human message to Haven through the **bot webhook API** (`POST /api/webhooks/:token`), passing the Discord author's name + avatar as the per-message persona.
- **Haven → Discord:** a Haven **bot account** connects over Socket.IO, listens for `new-message` in the mapped channel, and forwards each human message to a **Discord webhook** (which supports per-message username + avatar).
- **Loop-safe:** the Haven→Discord leg skips webhook-posted and own-account messages; the Discord→Haven leg skips messages from its own Discord webhook. So a bridged message never bounces back.

Everything runs on **your** host. No credentials are sent anywhere except your own Haven server and Discord.

## Requirements

- Node.js ≥ 18
- A Haven server you administer (to create the bot webhook + a bridge user account)
- A Discord application/bot with the **Message Content** intent enabled, plus a channel webhook

## Setup

### 1. Haven side
1. **Bridge user:** create a normal Haven account (e.g. `bridge`), and make sure it's a member of the channel you want to bridge. Put its username/password in `HAVEN_BOT_USERNAME` / `HAVEN_BOT_PASSWORD`. (This is how the bridge *reads* Haven messages — your own server, your own account.)
2. **Bot webhook:** in **Settings → Server Admin Settings → Bots**, create a bot in that same channel and copy its **Webhook URL** into `HAVEN_WEBHOOK_URL`. (This is how the bridge *writes* into Haven.)
3. Copy the channel's 8-hex `code` into `HAVEN_CHANNEL_CODE`.

### 2. Discord side
1. Create an application + bot at <https://discord.com/developers/applications>, enable the **Message Content** intent, and invite it to your server with *Read Messages* permission. Put the bot token in `DISCORD_BOT_TOKEN`.
2. Enable **Developer Mode** (User Settings → Advanced), right-click the channel → **Copy Channel ID** → `DISCORD_CHANNEL_ID`.
3. In **Channel Settings → Integrations → Webhooks**, create a webhook and copy its URL into `DISCORD_WEBHOOK_URL`.

### 3. Run

```bash
git clone https://github.com/ancsemi/haven-community.git
cd haven-community/bots/discord-bridge
npm install
cp .env.example .env
# edit .env with your values, then:
npm start
```

Host it anywhere that can stay online and reach both Discord and your Haven server — a small VPS, Fly.io, Railway, Render, or a home box. It reconnects automatically.

## Limitations / notes

- Bridges **one** Discord channel ↔ **one** Haven channel per process. Run multiple instances (or extend the mapping) for more.
- Attachments are bridged as **links**, not re-uploaded.
- Edits, deletes, reactions, threads, and replies are not propagated (messages only) in this first version.
- Set `HAVEN_INSECURE_TLS=true` only if your Haven uses a self-signed certificate.
- Respects Discord's API: it uses an official bot + webhooks (no selfbots).

## License

MIT — see [LICENSE](LICENSE).
