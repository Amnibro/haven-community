# Haven Community Bots & Webhooks

A community-maintained library of bots, webhooks, and integrations for [Haven](https://github.com/ancsemi/Haven) — the self-hosted private chat server.

These integrations are written and maintained by the Haven community. They are **not part of Haven itself** and are not reviewed or supported by the Haven maintainers beyond a basic sanity glance. Use them at your own discretion.

If you've built something useful for Haven, please PR it in. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

## Catalog

### Bots

| Name | Description | Language | Author |
|------|-------------|----------|--------|
| [`github-releases`](bots/github-releases/) | Posts a formatted message to a Haven channel whenever a new release is published on a watched GitHub repository. | Node.js | [@ancsemi](https://github.com/ancsemi) |
| [`rss`](bots/rss/) | Polls RSS/Atom feeds and posts new items into a Haven channel (optional `/rss` management). | Node.js | [@Amnibro](https://github.com/Amnibro) |
| [`welcome`](bots/welcome/) | Greets users when they join a channel via Haven `member-joined` events. | Node.js | [@Amnibro](https://github.com/Amnibro) |
| [`reminders`](bots/reminders/) | Schedule channel reminders with `/remind` and `/reminders` (persisted timer). | Node.js | [@Amnibro](https://github.com/Amnibro) |
| [`automod`](bots/automod/) | Word-list automod on `message` events: warn, optional delete and mute. | Node.js | [@Amnibro](https://github.com/Amnibro) |

### Webhooks

_None yet — be the first to add one!_

---

## Using a bot from this library

Most entries are small, self-contained scripts. The general pattern is:

1. Read the bot's own README to see what env vars / config it needs.
2. Create a Haven bot in your server (`Settings → Server Admin Settings → Bots`) and copy its webhook token.
3. Host the script somewhere that can reach both Haven and (if applicable) whatever external service it integrates with — a $0 tier on Fly.io / Railway / Render / Cloudflare Workers / a tiny VPS all work fine.
4. Set the required env vars and start it.

---

## Disclaimer

Code in this repo is contributed by community members. The Haven maintainers do not endorse, audit, or guarantee any individual entry. Always read a bot's source before pointing it at your server — especially if it asks for a bot token with moderation permissions.

Each subfolder is licensed individually (see its `LICENSE` file). When in doubt, assume MIT.
