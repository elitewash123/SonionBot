import { moderationCommands } from './moderation.js';
import { gatheringCommands } from './gathering.js';
import { economyCommands } from './economy.js';
import { casinoCommands, handleBlackjackAction } from './casino.js';
import { funCommands } from './fun.js';
import { generalCommands } from './general.js';
import { errorEmbed, successEmbed, createEmbed, COLORS, formatNumber } from '../discord/embeds.js';
import { activeCrashGames } from '../games/crash.js';
import { activeTrivia } from '../games/trivia.js';
import { activeDuels } from '../games/minigames.js';

// Aggregate all commands
export const ALL_COMMANDS = {
  ...moderationCommands,
  ...gatheringCommands,
  ...economyCommands,
  ...casinoCommands,
  ...funCommands,
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
    const clickingUserId = interaction.member?.user?.id || interaction.user?.id;

    // --- 1. BLACKJACK BUTTONS ---
    if (customId.startsWith('bj_')) {
      const parts = customId.split('_');
      const action = parts[1]; // 'hit', 'stand', 'double'
      const targetUserId = parts[2];

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
      return;
    }

    // --- 2. CRASH CASHOUT BUTTON ---
    if (customId.startsWith('crash_cashout_')) {
      const targetUserId = customId.replace('crash_cashout_', '');

      if (clickingUserId !== targetUserId) {
        return rest.interactionCallback(interaction.id, interaction.token, {
          type: 4,
          data: {
            embeds: [errorEmbed('Not Your Game', 'You cannot cash out someone else\'s Crash game!')],
            flags: 64
          }
        });
      }

      const game = activeCrashGames.get(targetUserId);
      if (game) {
        game.cashOut(interaction);
      }
      return;
    }

    // --- 3. TRIVIA BUTTONS ---
    if (customId.startsWith('trivia_ans_')) {
      const parts = customId.split('_');
      const targetUserId = parts[2];
      const selectedIdx = parseInt(parts[3], 10);

      if (clickingUserId !== targetUserId) {
        return rest.interactionCallback(interaction.id, interaction.token, {
          type: 4,
          data: {
            embeds: [errorEmbed('Not Your Quiz', 'Use `!trivia` to start your own quiz! 😊')],
            flags: 64
          }
        });
      }

      const game = activeTrivia.get(targetUserId);
      if (game && game.status === 'ACTIVE') {
        game.selectedOption = selectedIdx;
        const isCorrect = selectedIdx === game.question.correct;
        game.status = isCorrect ? 'CORRECT' : 'WRONG';
        activeTrivia.delete(targetUserId);

        if (isCorrect) {
          const user = db.getUser(targetUserId);
          user.wallet += game.reward;
          user.stats.total_earned = (user.stats.total_earned || 0) + game.reward;
          db.queueSave();
        }

        return rest.interactionCallback(interaction.id, interaction.token, {
          type: 7, // UPDATE_MESSAGE
          data: {
            embeds: [game.getEmbed()],
            components: []
          }
        });
      }
      return;
    }

    // --- 4. PVP DUEL BUTTONS ---
    if (customId.startsWith('duel_accept_') || customId.startsWith('duel_decline_')) {
      const isAccept = customId.startsWith('duel_accept_');
      const duelId = customId.replace(isAccept ? 'duel_accept_' : 'duel_decline_', '');
      const duel = activeDuels.get(duelId);

      if (!duel || duel.status !== 'PENDING') {
        return rest.interactionCallback(interaction.id, interaction.token, {
          type: 4,
          data: {
            embeds: [errorEmbed('Expired Duel', 'This duel challenge has already expired or concluded.')],
            flags: 64
          }
        });
      }

      // Only the challenged target can accept/decline
      if (clickingUserId !== duel.targetId) {
        return rest.interactionCallback(interaction.id, interaction.token, {
          type: 4,
          data: {
            embeds: [errorEmbed('Not For You', 'Only the challenged player can accept or decline this duel!')],
            flags: 64
          }
        });
      }

      activeDuels.delete(duelId);

      if (!isAccept) {
        return rest.interactionCallback(interaction.id, interaction.token, {
          type: 7,
          data: {
            embeds: [createEmbed({
              title: '⚔️ Duel Declined',
              description: `<@${duel.targetId}> has declined the duel challenge from <@${duel.challengerId}>.`,
              color: COLORS.DARK
            })],
            components: []
          }
        });
      }

      // Process Combat
      const challenger = db.getUser(duel.challengerId);
      const target = db.getUser(duel.targetId);

      if (challenger.wallet < duel.bet || target.wallet < duel.bet) {
        return rest.interactionCallback(interaction.id, interaction.token, {
          type: 7,
          data: {
            embeds: [errorEmbed('Duel Cancelled', 'One or both players no longer have sufficient funds for the wager!')],
            components: []
          }
        });
      }

      // Deduct bets
      challenger.wallet -= duel.bet;
      target.wallet -= duel.bet;

      // 50/50 Roll with combat flavor
      const challengerRoll = Math.floor(Math.random() * 100) + 1;
      const targetRoll = Math.floor(Math.random() * 100) + 1;

      const challengerWins = challengerRoll >= targetRoll;
      const winnerId = challengerWins ? duel.challengerId : duel.targetId;
      const loserId = challengerWins ? duel.targetId : duel.challengerId;
      const winnerUser = challengerWins ? challenger : target;

      const totalPot = duel.bet * 2;
      winnerUser.wallet += totalPot;
      winnerUser.stats.total_earned = (winnerUser.stats.total_earned || 0) + duel.bet;
      db.queueSave();

      const combatDesc = `
⚔️ **DUEL SHOWDOWN IN THE ARENA!** ⚔️

💥 <@${duel.challengerId}> rolled a combat strike of **[ ${challengerRoll} ]**
💥 <@${duel.targetId}> rolled a combat strike of **[ ${targetRoll} ]**

🏆 **WINNER:** <@${winnerId}> has slain their opponent and claimed the entire prize pot of 🪙 **${formatNumber(totalPot)}** coins!`;

      return rest.interactionCallback(interaction.id, interaction.token, {
        type: 7,
        data: {
          embeds: [createEmbed({
            title: '👑 Arena Champion Crowned!',
            description: combatDesc,
            color: COLORS.GOLD
          })],
          components: []
        }
      });
    }
  }
}
