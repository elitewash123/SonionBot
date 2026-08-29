# ⚡ SonionBot — All-in-One Discord Bot (Zero Node Modules)

> **Zero External Dependencies (`node_modules`)** — Runs directly on pure native Node.js 20+ built-ins!

SonionBot is a feature-rich, standalone Discord bot built with rich Discord embeds, gathering RPG mechanics, casino games, interactive button-driven Blackjack, a balanced economy system, and an administrative moderation suite.

---

## 🌟 Key Features

- 🚀 **Zero `node_modules`**: Built using native Node.js 20+ `fetch`, global `WebSocket`, `node:crypto`, and `node:fs`. No `npm install` required!
- 🛡️ **Full Moderation Suite**: Admin/Mod-only commands (`!kick`, `!ban`, `!unban`, `!timeout`, `!untimeout`, `!warn`, `!warns`, `!clearwarns`, `!purge`, `!slowmode`, `!lock`, `!unlock`, `!modlogs`).
- 🎣 **Gathering RPG Exploration**: 
  - `!fish`, `!mine`, `!dig`, `!hunt`
  - 50+ collectible items across 6 rarity tiers (Common ⚪, Uncommon 🟢, Rare 🔵, Epic 🟣, Legendary 🟡, Mythical 🔴).
  - Progressive tool upgrades (Tier 1-5 rods, pickaxes, shovels, weapons).
  - Skill XP & Leveling system.
- 🎰 **Casino & Gambling**:
  - `!blackjack` / `!bj` — **Interactive Discord Button components** (Hit 🃏, Stand 🛑, Double Down 💰).
  - `!slots` — 3-reel animated slots with up to 25x Jackpots.
  - `!coinflip` — 50/50 double-or-nothing toss.
  - `!roulette` — Color & number bets.
  - `!dice` — 2-Dice showdown.
- 💰 **Balanced Economy & Market**:
  - `!balance`, `!deposit`, `!withdraw`, `!daily` (with streak multipliers), `!work`, `!rob`, `!shop`, `!buy`, `!inventory`, `!sell`, `!leaderboard`, `!profile`.
- 📊 **Rich UI / Visuals**: Custom ASCII progress bars, colored embed themes, formatted player stats cards.

---

## 🚀 Quick Setup Guide

### 1. Requirements
- Node.js version **20.0.0 or higher** (You have `v24.17.0` installed!).

### 2. Configure Discord Bot Token
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create or select your application, navigate to **Bot**.
3. Under **Privileged Gateway Intents**, enable:
   - ✅ **Message Content Intent** (Required for reading `!` commands)
   - ✅ **Server Members Intent** (Required for member actions)
4. Copy your **Bot Token**.
5. Open [config.json](file:///c:/Users/sem/Downloads/sonionBot/config.json) (or `.env`) and paste your token:
   ```json
   {
     "token": "YOUR_DISCORD_BOT_TOKEN_HERE",
     "prefix": "!",
     "adminIds": ["YOUR_DISCORD_USER_ID"]
   }
   ```

### 3. Invite Bot to Your Server
In the Discord Developer Portal, go to **OAuth2** ➡️ **URL Generator**:
- Scopes: `bot`, `applications.commands`
- Bot Permissions: `Administrator` (or *Kick Members, Ban Members, Manage Channels, Manage Messages, Moderate Members, Send Messages, Embed Links*).
- Copy the generated URL into your browser to invite the bot.

### 4. Start the Bot
Run the bot with a single command (no npm install needed!):
```bash
node index.js
```

---

## 📜 Full Command Reference

### 🛡️ Moderation Commands (Admins & Moderators Only)
| Command | Usage | Description | Required Perms |
|---|---|---|---|
| `!kick` | `!kick @user [reason]` | Kicks member from the server | Kick Members |
| `!ban` | `!ban @user [reason]` | Bans user permanently | Ban Members |
| `!unban` | `!unban <userId>` | Unbans user by ID | Ban Members |
| `!timeout` / `!mute` | `!timeout @user <duration: 10m\|1h\|1d> [reason]` | Times out / mutes a member | Moderate Members |
| `!untimeout` / `!unmute` | `!untimeout @user` | Removes member timeout | Moderate Members |
| `!warn` | `!warn @user <reason>` | Issues disciplinary warning | Moderate Members |
| `!warns` | `!warns @user` | Views warning history | Moderate Members |
| `!clearwarns` | `!clearwarns @user` | Clears all warnings for a user | Administrator |
| `!purge` / `!clear` | `!purge <1-100>` | Bulk deletes recent messages | Manage Messages |
| `!slowmode` | `!slowmode <seconds>` | Sets channel rate limit (0 to disable) | Manage Channels |
| `!lock` | `!lock [reason]` | Locks channel for `@everyone` | Manage Channels |
| `!unlock` | `!unlock` | Unlocks channel | Manage Channels |
| `!modlogs` | `!modlogs` | Displays recent audit actions | Moderate Members |

---

### 🎣 RPG Gathering & Exploration
| Command | Description |
|---|---|
| `!fish` | Cast line to catch marine creatures and underwater treasure. |
| `!mine` | Mine deep caverns for rare gems, crystals, and meteorites. |
| `!dig` | Excavate archaeological sites for fossils, geodes, and pirate chests. |
| `!hunt` | Track wildlife and mythical apex predators in the wilderness. |

---

### 🎮 Interactive Fun & Minigames
| Command | Usage | Description |
|---|---|---|
| `!crash` | `!crash <bet>` | Live Rocket Crash game. Click **Cash Out 💰** button in real-time before the rocket explodes! |
| `!trivia` / `!quiz` | `!trivia` | 4-Option multiple choice quiz with **Interactive Discord Buttons** (`A`, `B`, `C`, `D`) to earn coins. |
| `!scratch` / `!lotto` | `!scratch <bet>` | 6-Square scratchcard lottery ticket. Match 3 symbols to win up to **20x**! |
| `!wheel` / `!spin` | `!wheel` | Spin the Wheel of Fortune (every 2h) for Grand Jackpots, Luck Potions, and Golden Baits. |
| `!rps` | `!rps <rock\|paper\|scissors> [bet]` | Rock Paper Scissors against the bot with optional coin bets. |
| `!duel` | `!duel @user <bet>` | High-stakes PvP Combat Arena showdown with **Accept / Decline buttons**! |

---

### 💰 Economy & Market
| Command | Usage | Description |
|---|---|---|
| `!balance` / `!bal` | `!bal [@user]` | View wallet, bank, and net worth. |
| `!deposit` / `!dep` | `!dep <amount\|all>` | Safely deposit coins into your bank. |
| `!withdraw` / `!with` | `!with <amount\|all>` | Withdraw coins from bank into wallet. |
| `!daily` | `!daily` | Claim daily reward + consecutive streak bonus. |
| `!work` | `!work` | Work a shift across different professions for coins. |
| `!rob` | `!rob @user` | High-stakes pickpocketing with police fine risk. |
| `!shop` | `!shop [tools\|consumables]` | Browse tool upgrades (Tier 1-5) & lucky buffs. |
| `!buy` | `!buy <item_id> [amount]` | Purchase gear and consumables. |
| `!inventory` / `!inv` | `!inv [@user]` | View all gathered items and total sell value. |
| `!sell` | `!sell <item_id\|all> [amount]` | Liquidate gathered loot for coins. |
| `!leaderboard` / `!lb` | `!lb [money\|fishing\|mining\|digging\|hunting]` | View top wealthiest tycoons & skill masters. |
| `!profile` / `!stats` | `!profile [@user]` | RPG Player Card with gear, stats, and skill progress bars. |

---

### 🎰 Casino & Gambling Games
| Command | Usage | Description |
|---|---|---|
| `!blackjack` / `!bj` | `!bj <bet>` | Interactive Blackjack table with **Discord Buttons** (`Hit`, `Stand`, `Double Down`). |
| `!slots` | `!slots <bet>` | 3-Reel Slots with up to **25x Jackpot** multipliers. |
| `!coinflip` / `!cf` | `!cf <heads\|tails> <bet>` | 50/50 double payout coin toss. |
| `!roulette` | `!roulette <red\|black\|green\|0-36> <bet>` | European roulette with up to 36x payout. |
| `!dice` | `!dice <bet>` | Roll 2 dice against the dealer for double payout. |

---

### ℹ️ General & Utilities
| Command | Description |
|---|---|
| `!help [command]` | Interactive guide and command directory. |
| `!ping` | Shows bot latency & gateway connection status. |
| `!botinfo` | Displays bot uptime, memory usage, and zero-dependency status. |

---

## 🛠️ Running the Test Suite
You can verify all game mechanics, permissions, and database operations at any time:
```bash
node test.js
```
