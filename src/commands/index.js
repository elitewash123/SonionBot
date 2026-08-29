// ==========================================================
// Central Command Registry & Event Router
// ==========================================================

import { moderationCommands } from './moderation.js';
import { gatheringCommands } from './gathering.js';
import { economyCommands } from './economy.js';
import { casinoCommands, handleBlackjackAction } from './casino.js';
import { generalCommands } from './general.js';
import { errorEmbed } from '../discord/embeds.js';

// Aggregate all commands
export const ALL_COMMANDS = {
  ...moderationCommands,
  ...gatheringCommands,
  ...economyCommands,
  ...casinoCommands,
  ...generalCommands
};

// Build alias lookup map
export const COMMAND_MAP = new Map();

for (const [key, cmd] of Object.entries(ALL_COMMANDS)) {
  COMMAND_MAP.set(key.toLowerCase(), cmd);
  if (cmd.aliases && Array.isArray(cmd.aliases)) {
    for (const alias of cmd.aliases) {
      COMMAND_MAP.set(alias.toLowerCase(), cmd);
    }
  }
}

/**
 * Handles incoming Discord Gateway MESSAGE_CREATE events
 */
export async function handleMessage({ message, rest, db, config }) {
  // Ignore bot messages or empty messages
  if (!message || message.author?.bot || !message.content) return;

  const guildSettings = db.getGuild(message.guild_id);
  const prefix = guildSettings.prefix || config.prefix || '!';

  if (!message.content.startsWith(prefix)) return;

  const rawArgs = message.content.slice(prefix.length).trim().split(/\s+/);
  const commandName = rawArgs.shift().toLowerCase();

  const command = COMMAND_MAP.get(commandName);
  if (!command) return;

  try {
    const member = message.member || { user: message.author };
    const adminIds = config.adminIds || [];

    await command.execute({
      rest,
      message,
      args: rawArgs,
      member,
      adminIds,
      db,
      allCommands: ALL_COMMANDS,
      config
    });
  } catch (err) {
    console.error(`[Command Error] Error executing !${commandName}:`, err);
    try {
      await rest.sendMessage(message.channel_id, {
        embeds: errorEmbed('Command Error', `An error occurred while executing this command: \`${err.message}\``)
      });
    } catch (_) {}
  }
}

/**
 * Handles incoming Discord Gateway INTERACTION_CREATE events (Buttons, etc.)
 */
export async function handleInteraction({ interaction, rest, db, config }) {
  if (!interaction) return;

  // Type 2 = MESSAGE_COMPONENT (Button clicked)
  if (interaction.type === 3 || interaction.data?.component_type === 2) {
    const customId = interaction.data?.custom_id || '';

    // Blackjack buttons: bj_hit_<userId>, bj_stand_<userId>, bj_double_<userId>
    if (customId.startsWith('bj_')) {
      const parts = customId.split('_');
      const action = parts[1]; // 'hit', 'stand', 'double'
      const targetUserId = parts[2];

      const clickingUserId = interaction.member?.user?.id || interaction.user?.id;

      // Only the player who started the game can press the buttons
      if (clickingUserId !== targetUserId) {
        return rest.interactionCallback(interaction.id, interaction.token, {
          type: 4,
          data: {
            embeds: [errorEmbed('Not Your Game', 'You cannot play someone else\'s Blackjack game!')],
            flags: 64 // Ephemeral
          }
        });
      }

      await handleBlackjackAction(targetUserId, action, rest, db, interaction);
    }
  }
}
