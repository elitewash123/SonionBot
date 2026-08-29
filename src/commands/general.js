// ==========================================================
// General & Informational Commands (!help, !ping, !botinfo)
// ==========================================================

import { createEmbed, COLORS, formatNumber } from '../discord/embeds.js';
import os from 'node:os';

export const generalCommands = {
  // --- HELP ---
  help: {
    name: 'help',
    description: 'Displays full command guide and interactive directory.',
    usage: '!help [category|command]',
    async execute({ rest, message, args, allCommands }) {
      const query = (args[0] || '').toLowerCase();

      // If querying a specific command
      if (query && allCommands[query]) {
        const cmd = allCommands[query];
        return rest.sendMessage(message.channel_id, {
          embeds: createEmbed({
            title: `📖 Command Guide: !${cmd.name}`,
            description: cmd.description || 'No description available.',
            color: COLORS.INFO,
            fields: [
              { name: '📝 Usage', value: `\`${cmd.usage || `!${cmd.name}`}\``, inline: true },
              { name: '🔄 Aliases', value: cmd.aliases?.length ? cmd.aliases.map(a => `\`!${a}\``).join(', ') : 'None', inline: true }
            ],
            footer: 'Parameters in <brackets> are required, [brackets] are optional.'
          })
        });
      }

      // Default Help Menu
      const fields = [
        {
          name: '🛡️ Moderation Suite (Admins/Mods Only)',
          value: '`!kick` `!ban` `!unban` `!timeout` `!untimeout` `!warn` `!warns` `!clearwarns` `!purge` `!slowmode` `!lock` `!unlock` `!modlogs`'
        },
        {
          name: '🎣 RPG Gathering & Exploration',
          value: '`!fish` • Catch 15+ fish & ocean relics\n`!mine` • Extract rare gems, crystals & meteors\n`!dig` • Excavate dinosaur fossils & chests\n`!hunt` • Track wildlife, hydras & dragons'
        },
        {
          name: '💰 Economy & Market',
          value: '`!balance` `!deposit` `!withdraw` `!daily` `!work` `!rob` `!shop` `!buy` `!inventory` `!sell` `!leaderboard` `!profile`'
        },
        {
          name: '🎰 Casino & Gambling Games',
          value: '`!blackjack` • Interactive Discord Button Table\n`!slots` • 3-Reel Slots (up to 25x Jackpot)\n`!coinflip` • Double-or-nothing toss\n`!roulette` • Red / Black / Green / Numbers\n`!dice` • 2-Dice showdown'
        },
        {
          name: 'ℹ️ Information & Utilities',
          value: '`!help [command]` `!ping` `!botinfo`'
        }
      ];

      return rest.sendMessage(message.channel_id, {
        embeds: createEmbed({
          title: '⚡ SonionBot — Complete Command Directory',
          description: 'A complete all-in-one Discord bot featuring RPG gathering, interactive casino games, a balanced economy, and advanced moderation.\n\n*Built in 100% pure native Node.js (0 node_modules needed!)*',
          color: COLORS.PRIMARY,
          fields,
          footer: 'Type !help <command> for detailed parameter instructions.'
        })
      });
    }
  },

  // --- PING ---
  ping: {
    name: 'ping',
    description: 'Checks bot latency and REST response time.',
    usage: '!ping',
    async execute({ rest, message }) {
      const start = Date.now();
      const sent = await rest.sendMessage(message.channel_id, {
        embeds: createEmbed({
          title: '🏓 Pong!',
          description: 'Measuring latency...',
          color: COLORS.INFO
        })
      });
      const latency = Date.now() - start;

      if (sent && sent.id) {
        return rest.editMessage(message.channel_id, sent.id, {
          embeds: createEmbed({
            title: '🏓 Pong!',
            description: `⚡ **REST Latency:** \`${latency}ms\`\n🤖 **Gateway Status:** \`Online (Native WebSocket)\``,
            color: COLORS.SUCCESS
          })
        });
      }
    }
  },

  // --- BOTINFO ---
  botinfo: {
    name: 'botinfo',
    aliases: ['info', 'about'],
    description: 'Displays bot system information, uptime, and architecture details.',
    usage: '!botinfo',
    async execute({ rest, message, db }) {
      const uptimeSec = process.uptime();
      const h = Math.floor(uptimeSec / 3600);
      const m = Math.floor((uptimeSec % 3600) / 60);
      const s = Math.floor(uptimeSec % 60);

      const memUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const totalUsers = Object.keys(db.data.users || {}).length;

      return rest.sendMessage(message.channel_id, {
        embeds: createEmbed({
          title: '🤖 SonionBot System Information',
          description: 'High-performance Discord bot engine with **zero node_modules** dependencies.',
          color: COLORS.PRIMARY,
          fields: [
            { name: '⏱️ Uptime', value: `\`${h}h ${m}m ${s}s\``, inline: true },
            { name: '💾 Memory Usage', value: `\`${memUsage} MB\``, inline: true },
            { name: '👥 Registered Players', value: `\`${formatNumber(totalUsers)}\``, inline: true },
            { name: '⚙️ Runtime', value: `\`Node.js ${process.version}\``, inline: true },
            { name: '📦 Dependencies', value: '`0 (Zero node_modules)`', inline: true },
            { name: '🖥️ System Platform', value: `\`${os.type()} ${os.arch()}\``, inline: true }
          ]
        })
      });
    }
  }
};
