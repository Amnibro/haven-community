# Checklist: Discord-parity community bots v2

Goal: bring `ancsemi/haven-community` closer to Discord ecosystem coverage via deployable Haven bots.

Pace: **2 bots every 15 minutes** until the queue is empty.

## Wave 1 — core Discord parity (20)

| # | Bot | Discord analogue | Status |
|---|-----|------------------|--------|
| 1 | `rss` | RSS / Dyno feeds | [x] |
| 2 | `welcome` | MEE6 / ProBot welcome | [x] |
| 3 | `reminders` | Carl / YAGPDB remind | [x] |
| 4 | `automod` | Dyno / Carl automod | [x] |
| 5 | `custom-commands` | Carl custom commands | [x] |
| 6 | `leveling` | MEE6 XP | [x] |
| 7 | `starboard` | Starboard bots | [x] |
| 8 | `twitch-live` | Twitch go-live | [x] |
| 9 | `youtube` | YouTube uploads | [x] |
| 10 | `polls` | Simple poll bots | [x] |
| 11 | `giveaway` | GiveawayBot | [x] |
| 12 | `uptime` | Status / uptime pings | [x] |
| 13 | `translate` | Translate bots | [x] |
| 14 | `weather` | Weather bots | [x] |
| 15 | `reddit` | Reddit feed bots | [x] |
| 16 | `scheduled-announce` | Scheduled messages | [x] |
| 17 | `tickets` | Ticket Tool | [x] |
| 18 | `suggestions` | Suggestion boxes | [x] |
| 19 | `moderation` | Dyno mod slash cmds | [x] |
| 20 | `afk` | AFK bots | [x] |

## Wave 2 — extended parity (fun / utility / dev)

| # | Bot | Discord analogue | Status |
|---|-----|------------------|--------|
| 21 | `counting` | Counting channels | [ ] |
| 22 | `quotes` | Quote books | [ ] |
| 23 | `define` | Dictionary | [ ] |
| 24 | `crypto` | Crypto price bots | [ ] |
| 25 | `world-clock` | Timezone boards | [ ] |
| 26 | `gitlab-releases` | GitLab release posts | [ ] |
| 27 | `steam-news` | Steam news | [ ] |
| 28 | `hackernews` | HN feed | [ ] |
| 29 | `karma` | Reddit-style karma | [ ] |
| 30 | `confessions` | Confession bots | [ ] |
| 31 | `say` | Admin announce-as-bot | [ ] |
| 32 | `purge` | Bulk delete helpers | [ ] |
| 33 | `dice` | RPG dice | [ ] |
| 34 | `choose` | Pick-one bots | [ ] |
| 35 | `wikipedia` | Wiki lookup | [ ] |
| 36 | `math` | Calculator | [ ] |
| 37 | `joke` | Joke bots | [ ] |
| 38 | `animal-pics` | Cat/dog image bots | [ ] |
| 39 | `github-issues` | Issue webhooks | [ ] |
| 40 | `npm-releases` | npm package updates | [ ] |
| 41 | `birthday` | Birthday bots | [ ] |
| 42 | `rsvp` | Event RSVP | [ ] |
| 43 | `bump-reminder` | Disboard-style bump | [ ] |
| 44 | `lastfm` | Last.fm now-playing | [ ] |
| 45 | `trivia` | Trivia bots | [ ] |
| 46 | `warns` | Warn systems | [ ] |
| 47 | `report` | User report bots | [ ] |
| 48 | `sticky` | Sticky message bots | [ ] |
| 49 | `timezone-convert` | TZ convert | [ ] |
| 50 | `urbandict` | Urban Dictionary | [ ] |
| 51 | `color` | Hex/color tools | [ ] |
| 52 | `uuid-tool` | UUID generators | [ ] |
| 53 | `base64` | Encode/decode utils | [ ] |
| 54 | `password-gen` | Password generators | [ ] |
| 55 | `echo-once` | Ephemeral echo / DM-style | [ ] |
| 56 | `mod-notes` | Staff notes | [ ] |

Already elsewhere: `github-releases` (upstream), `discord-bridge` (fork branch `feat/discord-bridge`).

## Per-bot deliverables

- [ ] `bots/<name>/server.js`
- [ ] `bots/<name>/package.json`
- [ ] `bots/<name>/.env.example`
- [ ] `bots/<name>/README.md`
- [ ] Root `README.md` catalog row
- [ ] Commit on `community-bots-parity`

## Batches

- [x] Batches 1–8: through scheduled-announce
- [x] Batch 9: tickets + suggestions
- [x] Batch 10: moderation + afk (wave 1 complete)
- [ ] Continue at 2 bots / 15 min until queue empty
- [ ] Open PR to ancsemi/haven-community (or keep on Amnibro fork)

## Notes

- Match style of `bots/github-releases` (Node 18+, Express when needed, env-only config).
- Verify Haven HMAC: event callbacks use `sha256=<hex>`; slash callbacks may send bare hex — accept both.
- Events available: `message`, `member-joined`, `reaction-added`.
- Moderation REST requires admin-enabled `can_moderate` on the webhook bot.
