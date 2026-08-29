// ==========================================================
// Administration & Moderation Commands (Admin / Mod Only)
// ==========================================================

import { PERMISSIONS, hasPermission } from '../discord/permissions.js';
import { createEmbed, errorEmbed, successEmbed, COLORS } from '../discord/embeds.js';

// Parse duration string like "10m", "2h", "1d", "30s" to milliseconds
export function parseDuration(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)(s|m|h|d)$/i);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case 's': return val * 1000;
    case 'm': return val * 60 * 1000;
    case 'h': return val * 60 * 60 * 1000;
    case 'd': return val * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

// Extract mention ID or raw user ID from string
export function parseUserId(arg) {
  if (!arg) return null;
  const clean = arg.replace(/[<@!>]/g, '');
  if (/^\d{17,20}$/.test(clean)) {
    return clean;
  }
  return null;
}

export const moderationCommands = {
  // --- KICK ---
  kick: {
    name: 'kick',
    description: 'Kicks a member from the server.',
    usage: '!kick @user [reason]',
    perm: PERMISSIONS.KICK_MEMBERS,
    async execute({ rest, message, args, member, adminIds, db }) {
      if (!hasPermission(member, PERMISSIONS.KICK_MEMBERS, adminIds)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Permission Denied', 'You do not have permission to kick members (Requires **Kick Members** or Administrator).')
        });
      }

      const targetId = parseUserId(args[0]);
      if (!targetId) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid User', 'Please mention a valid user or provide their User ID: `!kick @user [reason]`')
        });
      }

      if (targetId === message.author.id) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Action Not Allowed', 'You cannot kick yourself!')
        });
      }

      const reason = args.slice(1).join(' ') || 'No reason provided';

      try {
        await rest.kickMember(message.guild_id, targetId, `${reason} | By ${message.author.username}`);

        // Log to database
        db.updateGuild(message.guild_id, g => {
          g.mod_logs.push({
            id: Date.now().toString(),
            action: 'KICK',
            targetId,
            moderatorId: message.author.id,
            reason,
            timestamp: new Date().toISOString()
          });
        });

        return rest.sendMessage(message.channel_id, {
          embeds: successEmbed(
            'Member Kicked',
            `👢 <@${targetId}> has been kicked from the server.\n\n**Reason:** ${reason}\n**Moderator:** <@${message.author.id}>`
          )
        });
      } catch (err) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Kick Failed', `Could not kick user: ${err.message || 'Check bot role hierarchy.'}`)
        });
      }
    }
  },

  // --- BAN ---
  ban: {
    name: 'ban',
    description: 'Bans a user permanently from the server.',
    usage: '!ban @user [reason]',
    perm: PERMISSIONS.BAN_MEMBERS,
    async execute({ rest, message, args, member, adminIds, db }) {
      if (!hasPermission(member, PERMISSIONS.BAN_MEMBERS, adminIds)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Permission Denied', 'You do not have permission to ban members (Requires **Ban Members** or Administrator).')
        });
      }

      const targetId = parseUserId(args[0]);
      if (!targetId) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid User', 'Please mention a valid user or provide their User ID: `!ban @user [reason]`')
        });
      }

      if (targetId === message.author.id) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Action Not Allowed', 'You cannot ban yourself!')
        });
      }

      const reason = args.slice(1).join(' ') || 'No reason provided';

      try {
        await rest.banMember(message.guild_id, targetId, {
          delete_message_seconds: 86400, // 1 day
          reason: `${reason} | By ${message.author.username}`
        });

        db.updateGuild(message.guild_id, g => {
          g.mod_logs.push({
            id: Date.now().toString(),
            action: 'BAN',
            targetId,
            moderatorId: message.author.id,
            reason,
            timestamp: new Date().toISOString()
          });
        });

        return rest.sendMessage(message.channel_id, {
          embeds: successEmbed(
            'Member Banned',
            `🔨 <@${targetId}> has been banned from the server.\n\n**Reason:** ${reason}\n**Moderator:** <@${message.author.id}>`
          )
        });
      } catch (err) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Ban Failed', `Could not ban user: ${err.message || 'Check bot role hierarchy.'}`)
        });
      }
    }
  },

  // --- UNBAN ---
  unban: {
    name: 'unban',
    description: 'Unbans a user from the server by their ID.',
    usage: '!unban <userId> [reason]',
    perm: PERMISSIONS.BAN_MEMBERS,
    async execute({ rest, message, args, member, adminIds, db }) {
      if (!hasPermission(member, PERMISSIONS.BAN_MEMBERS, adminIds)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Permission Denied', 'You do not have permission to unban members.')
        });
      }

      const targetId = parseUserId(args[0]);
      if (!targetId) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid User ID', 'Please provide a valid User ID: `!unban <userId>`')
        });
      }

      const reason = args.slice(1).join(' ') || 'No reason provided';

      try {
        await rest.unbanMember(message.guild_id, targetId, reason);

        db.updateGuild(message.guild_id, g => {
          g.mod_logs.push({
            id: Date.now().toString(),
            action: 'UNBAN',
            targetId,
            moderatorId: message.author.id,
            reason,
            timestamp: new Date().toISOString()
          });
        });

        return rest.sendMessage(message.channel_id, {
          embeds: successEmbed('Member Unbanned', `🔓 User ID \`${targetId}\` has been unbanned.`)
        });
      } catch (err) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Unban Failed', `Could not unban user: ${err.message || 'User is not banned.'}`)
        });
      }
    }
  },

  // --- TIMEOUT / MUTE ---
  timeout: {
    name: 'timeout',
    aliases: ['mute'],
    description: 'Times out / mutes a member for a specified duration.',
    usage: '!timeout @user <duration: 10m|1h|1d> [reason]',
    perm: PERMISSIONS.MODERATE_MEMBERS,
    async execute({ rest, message, args, member, adminIds, db }) {
      if (!hasPermission(member, PERMISSIONS.MODERATE_MEMBERS, adminIds)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Permission Denied', 'Requires **Timeout Members / Moderate Members** or Administrator permission.')
        });
      }

      const targetId = parseUserId(args[0]);
      const durationStr = args[1];
      const durationMs = parseDuration(durationStr);

      if (!targetId || !durationMs) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Arguments', 'Usage: `!timeout @user <duration: 10m|1h|1d> [reason]`')
        });
      }

      const reason = args.slice(2).join(' ') || 'No reason provided';

      try {
        await rest.timeoutMember(message.guild_id, targetId, durationMs, `${reason} | By ${message.author.username}`);

        db.updateGuild(message.guild_id, g => {
          g.mod_logs.push({
            id: Date.now().toString(),
            action: 'TIMEOUT',
            targetId,
            moderatorId: message.author.id,
            duration: durationStr,
            reason,
            timestamp: new Date().toISOString()
          });
        });

        return rest.sendMessage(message.channel_id, {
          embeds: successEmbed(
            'Member Timed Out',
            `🔇 <@${targetId}> has been timed out for **${durationStr}**.\n\n**Reason:** ${reason}\n**Moderator:** <@${message.author.id}>`
          )
        });
      } catch (err) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Timeout Failed', `Could not timeout member: ${err.message}`)
        });
      }
    }
  },

  // --- UNTIMEOUT / UNMUTE ---
  untimeout: {
    name: 'untimeout',
    aliases: ['unmute'],
    description: 'Removes timeout / unmutes a member.',
    usage: '!untimeout @user',
    perm: PERMISSIONS.MODERATE_MEMBERS,
    async execute({ rest, message, args, member, adminIds, db }) {
      if (!hasPermission(member, PERMISSIONS.MODERATE_MEMBERS, adminIds)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Permission Denied', 'Requires **Timeout Members / Moderate Members** permission.')
        });
      }

      const targetId = parseUserId(args[0]);
      if (!targetId) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid User', 'Please mention a valid member: `!untimeout @user`')
        });
      }

      try {
        await rest.timeoutMember(message.guild_id, targetId, null, `Untimeout by ${message.author.username}`);

        return rest.sendMessage(message.channel_id, {
          embeds: successEmbed('Timeout Removed', `🔊 Timeout removed for <@${targetId}>.`)
        });
      } catch (err) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Untimeout Failed', `Could not remove timeout: ${err.message}`)
        });
      }
    }
  },

  // --- WARN SYSTEM ---
  warn: {
    name: 'warn',
    description: 'Issues an official warning to a user.',
    usage: '!warn @user <reason>',
    perm: PERMISSIONS.MODERATE_MEMBERS,
    async execute({ rest, message, args, member, adminIds, db }) {
      if (!hasPermission(member, PERMISSIONS.MODERATE_MEMBERS, adminIds)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Permission Denied', 'You do not have permission to issue warnings.')
        });
      }

      const targetId = parseUserId(args[0]);
      const reason = args.slice(1).join(' ');

      if (!targetId || !reason) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Arguments', 'Usage: `!warn @user <reason>`')
        });
      }

      let totalWarns = 0;
      db.updateGuild(message.guild_id, g => {
        g.warnings.push({
          id: Date.now().toString(),
          userId: targetId,
          moderatorId: message.author.id,
          reason,
          timestamp: new Date().toISOString()
        });
        totalWarns = g.warnings.filter(w => w.userId === targetId).length;
      });

      return rest.sendMessage(message.channel_id, {
        embeds: createEmbed({
          title: '⚠️ Member Warned',
          description: `<@${targetId}> has been officially warned.\n\n**Reason:** ${reason}\n**Moderator:** <@${message.author.id}>\n**Total Warnings:** ${totalWarns}`,
          color: COLORS.WARNING
        })
      });
    }
  },

  // --- VIEW WARNS ---
  warns: {
    name: 'warns',
    description: 'Views disciplinary warning history of a user.',
    usage: '!warns @user',
    perm: PERMISSIONS.MODERATE_MEMBERS,
    async execute({ rest, message, args, member, adminIds, db }) {
      if (!hasPermission(member, PERMISSIONS.MODERATE_MEMBERS, adminIds)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Permission Denied', 'Requires Moderator or Administrator permission.')
        });
      }

      const targetId = parseUserId(args[0]) || message.author.id;
      const guildData = db.getGuild(message.guild_id);
      const userWarns = guildData.warnings.filter(w => w.userId === targetId);

      if (userWarns.length === 0) {
        return rest.sendMessage(message.channel_id, {
          embeds: successEmbed('Clean Record', `<@${targetId}> has **0 warnings** on record! ✨`)
        });
      }

      const warnList = userWarns.map((w, idx) => {
        const date = new Date(w.timestamp).toLocaleDateString();
        return `**#${idx + 1}** [${date}] By <@${w.moderatorId}>: *${w.reason}*`;
      }).join('\n');

      return rest.sendMessage(message.channel_id, {
        embeds: createEmbed({
          title: `⚠️ Warnings for User`,
          description: `Total Warnings: **${userWarns.length}**\n\n${warnList}`,
          color: COLORS.WARNING,
          footer: 'Use !clearwarns @user to reset warnings.'
        })
      });
    }
  },

  // --- CLEAR WARNS ---
  clearwarns: {
    name: 'clearwarns',
    description: 'Clears all warnings for a user.',
    usage: '!clearwarns @user',
    perm: PERMISSIONS.ADMINISTRATOR,
    async execute({ rest, message, args, member, adminIds, db }) {
      if (!hasPermission(member, PERMISSIONS.ADMINISTRATOR, adminIds)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Permission Denied', 'Requires **Administrator** permission.')
        });
      }

      const targetId = parseUserId(args[0]);
      if (!targetId) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid User', 'Usage: `!clearwarns @user`')
        });
      }

      db.updateGuild(message.guild_id, g => {
        g.warnings = g.warnings.filter(w => w.userId !== targetId);
      });

      return rest.sendMessage(message.channel_id, {
        embeds: successEmbed('Warnings Cleared', `🧹 Cleared all warnings for <@${targetId}>.`)
      });
    }
  },

  // --- PURGE / CLEAR ---
  purge: {
    name: 'purge',
    aliases: ['clear'],
    description: 'Bulk deletes up to 100 recent messages from the channel.',
    usage: '!purge <1-100>',
    perm: PERMISSIONS.MANAGE_MESSAGES,
    async execute({ rest, message, args, member, adminIds }) {
      if (!hasPermission(member, PERMISSIONS.MANAGE_MESSAGES, adminIds)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Permission Denied', 'Requires **Manage Messages** permission.')
        });
      }

      const amount = parseInt(args[0], 10);
      if (isNaN(amount) || amount < 1 || amount > 100) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Count', 'Please specify a number of messages between 1 and 100: `!purge 20`')
        });
      }

      try {
        const messages = await rest.getChannelMessages(message.channel_id, Math.min(amount + 1, 100));
        const messageIds = messages.map(m => m.id);

        await rest.bulkDeleteMessages(message.channel_id, messageIds);

        const responseMsg = await rest.sendMessage(message.channel_id, {
          embeds: successEmbed('Purge Complete', `🧹 Successfully deleted **${messageIds.length - 1}** messages.`)
        });

        // Auto-delete confirmation after 4 seconds
        setTimeout(() => {
          if (responseMsg && responseMsg.id) {
            rest.deleteMessage(message.channel_id, responseMsg.id).catch(() => {});
          }
        }, 4000);
      } catch (err) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Purge Failed', `Could not delete messages: ${err.message}`)
        });
      }
    }
  },

  // --- SLOWMODE ---
  slowmode: {
    name: 'slowmode',
    description: 'Sets the slowmode rate limit for the channel (in seconds).',
    usage: '!slowmode <0-21600>',
    perm: PERMISSIONS.MANAGE_CHANNELS,
    async execute({ rest, message, args, member, adminIds }) {
      if (!hasPermission(member, PERMISSIONS.MANAGE_CHANNELS, adminIds)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Permission Denied', 'Requires **Manage Channel** permission.')
        });
      }

      const seconds = parseInt(args[0], 10);
      if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Seconds', 'Specify seconds from 0 (disabled) to 21600 (6 hours): `!slowmode 5`')
        });
      }

      try {
        await rest.setChannelSlowmode(message.channel_id, seconds, `Slowmode set by ${message.author.username}`);

        return rest.sendMessage(message.channel_id, {
          embeds: successEmbed(
            'Slowmode Updated',
            seconds === 0 ? '⏱️ Slowmode has been **disabled** in this channel.' : `⏱️ Slowmode set to **${seconds}s** per message.`
          )
        });
      } catch (err) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Slowmode Error', `Failed to set slowmode: ${err.message}`)
        });
      }
    }
  },

  // --- LOCKDOWN ---
  lock: {
    name: 'lock',
    description: 'Locks the current channel preventing @everyone from sending messages.',
    usage: '!lock [reason]',
    perm: PERMISSIONS.MANAGE_CHANNELS,
    async execute({ rest, message, args, member, adminIds }) {
      if (!hasPermission(member, PERMISSIONS.MANAGE_CHANNELS, adminIds)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Permission Denied', 'Requires **Manage Channels** permission.')
        });
      }

      const reason = args.join(' ') || 'Channel locked down by moderator';

      try {
        // Deny SEND_MESSAGES (1 << 11 = 2048) for @everyone (id === guild_id)
        await rest.setChannelPermission(message.channel_id, message.guild_id, {
          allow: '0',
          deny: (1n << 11n).toString(),
          type: 0 // Role overwrite
        }, reason);

        return rest.sendMessage(message.channel_id, {
          embeds: createEmbed({
            title: '🔒 Channel Locked',
            description: `This channel has been locked down by <@${message.author.id}>.\n\n**Reason:** ${reason}`,
            color: COLORS.ERROR
          })
        });
      } catch (err) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Lock Failed', `Could not lock channel: ${err.message}`)
        });
      }
    }
  },

  // --- UNLOCK ---
  unlock: {
    name: 'unlock',
    description: 'Unlocks the channel allowing @everyone to send messages again.',
    usage: '!unlock',
    perm: PERMISSIONS.MANAGE_CHANNELS,
    async execute({ rest, message, member, adminIds }) {
      if (!hasPermission(member, PERMISSIONS.MANAGE_CHANNELS, adminIds)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Permission Denied', 'Requires **Manage Channels** permission.')
        });
      }

      try {
        await rest.setChannelPermission(message.channel_id, message.guild_id, {
          allow: '0',
          deny: '0',
          type: 0
        }, `Unlocked by ${message.author.username}`);

        return rest.sendMessage(message.channel_id, {
          embeds: successEmbed('🔓 Channel Unlocked', 'The channel has been unlocked. Members can now send messages.')
        });
      } catch (err) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Unlock Failed', `Could not unlock channel: ${err.message}`)
        });
      }
    }
  },

  // --- MOD LOGS ---
  modlogs: {
    name: 'modlogs',
    description: 'Shows recent moderation actions in the server.',
    usage: '!modlogs',
    perm: PERMISSIONS.MODERATE_MEMBERS,
    async execute({ rest, message, member, adminIds, db }) {
      if (!hasPermission(member, PERMISSIONS.MODERATE_MEMBERS, adminIds)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Permission Denied', 'Requires Moderator or Administrator permission.')
        });
      }

      const guildData = db.getGuild(message.guild_id);
      const logs = (guildData.mod_logs || []).slice(-10).reverse();

      if (logs.length === 0) {
        return rest.sendMessage(message.channel_id, {
          embeds: createEmbed({
            title: '📜 Moderation Logs',
            description: 'No moderation actions recorded yet.',
            color: COLORS.INFO
          })
        });
      }

      const list = logs.map(l => {
        const date = new Date(l.timestamp).toLocaleTimeString();
        return `\`[${date}]\` **${l.action}** on <@${l.targetId}> by <@${l.moderatorId}> - *${l.reason || 'No reason'}*`;
      }).join('\n');

      return rest.sendMessage(message.channel_id, {
        embeds: createEmbed({
          title: '📜 Recent Moderation Logs',
          description: list,
          color: COLORS.INFO
        })
      });
    }
  }
};
