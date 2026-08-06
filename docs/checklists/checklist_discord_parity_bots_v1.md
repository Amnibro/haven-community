# Checklist: Discord-parity community bots v1

Goal: bring `ancsemi/haven-community` closer to Discord ecosystem coverage via deployable Haven bots.

Pace: **2 bots every 30 minutes** until the major list is complete.

## Major bot roadmap (priority order)

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
| 15 | `reddit` | Reddit feed bots | [ ] |
| 16 | `scheduled-announce` | Scheduled messages | [ ] |
| 17 | `tickets` | Ticket Tool | [ ] |
| 18 | `suggestions` | Suggestion boxes | [ ] |
| 19 | `moderation` | Dyno mod slash cmds | [ ] |
| 20 | `afk` | AFK bots | [ ] |

Already elsewhere: `github-releases` (upstream), `discord-bridge` (fork branch `feat/discord-bridge`).

## Per-bot deliverables

- [ ] `bots/<name>/server.js`
- [ ] `bots/<name>/package.json`
- [ ] `bots/<name>/.env.example`
- [ ] `bots/<name>/README.md`
- [ ] Root `README.md` catalog row
- [ ] Commit on `community-bots-parity`

## Batches

- [x] Batch 1 (now): rss, welcome
- [x] Batch 2 (+30m): reminders, automod
- [x] Batch 3: custom-commands, leveling
- [x] Batch 4: starboard, twitch-live
- [x] Batch 5: youtube, polls
- [x] Batch 6: giveaway, uptime
- [x] Batch 7: translate, weather
- [ ] Batch 8: reddit, scheduled-announce
- [ ] Batch 9: tickets, suggestions
- [ ] Batch 10: moderation, afk
- [ ] Open PR to ancsemi/haven-community (or keep on Amnibro fork)

## Notes

- Match style of `bots/github-releases` (Node 18+, Express when needed, env-only config).
- Verify Haven HMAC: event callbacks use `sha256=<hex>`; slash callbacks may send bare hex — accept both.
- Events available: `message`, `member-joined`, `reaction-added`.
- Moderation REST requires admin-enabled `can_moderate` on the webhook bot.
