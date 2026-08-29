// ==========================================================
// Fun Games Commands (Crash, Trivia, Scratch, Wheel, RPS, Duel)
// ==========================================================

import { CrashGame, activeCrashGames } from '../games/crash.js';
import { TriviaGame, activeTrivia } from '../games/trivia.js';
import { playScratchCard, spinFortuneWheel, playRPS, activeDuels } from '../games/minigames.js';
import { createEmbed, errorEmbed, successEmbed, COLORS, formatNumber, formatTime } from '../discord/embeds.js';
import { parseBet } from './casino.js';
import { parseUserId } from './moderation.js';

export const funCommands = {
  // --- CRASH GAME ---
  crash: {
    name: 'crash',
    description: 'Play the high-stakes Rocket Crash game. Click Cash Out before it crashes!',
    usage: '!crash <bet>',
    async execute({ rest, message, args, db }) {
      const userId = message.author.id;
      const user = db.getUser(userId);

      if (activeCrashGames.has(userId)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Crash in Progress', 'You already have an active Crash rocket flying! Click Cash Out.')
        });
      }

      const bet = parseBet(args[0], user);
      if (!bet || bet < 10) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Bet', 'Minimum bet is 🪙 **10** coins. Usage: `!crash <bet|all>`')
        });
      }

      if (user.wallet < bet) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Insufficient Funds', `You only have 🪙 **${formatNumber(user.wallet)}** coins in your wallet.`)
        });
      }

      user.wallet -= bet;
      db.queueSave();

      const game = new CrashGame(userId, message.author.username, bet, message.channel_id, rest, db);
      activeCrashGames.set(userId, game);
      await game.start();
    }
  },

  // --- TRIVIA ---
  trivia: {
    name: 'trivia',
    aliases: ['quiz'],
    description: 'Answer trivia questions with interactive buttons to earn coin rewards!',
    usage: '!trivia',
    async execute({ rest, message, db }) {
      const userId = message.author.id;
      const user = db.getUser(userId);

      // 30-second cooldown
      const now = Date.now();
      const lastTrivia = user.cooldowns.trivia || 0;
      const elapsed = (now - lastTrivia) / 1000;

      if (elapsed < 30) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Trivia Cooldown', `⏳ Brain recharge! Wait **${formatTime(30 - elapsed)}** before requesting another trivia.`)
        });
      }

      user.cooldowns.trivia = now;
      db.queueSave();

      const game = new TriviaGame(userId, message.author.username, message.channel_id);
      activeTrivia.set(userId, game);

      const sent = await rest.sendMessage(message.channel_id, {
        embeds: game.getEmbed(),
        components: game.getComponents()
      });

      if (sent && sent.id) {
        game.messageId = sent.id;
      }

      // 25s timeout for trivia
      setTimeout(() => {
        if (activeTrivia.has(userId) && activeTrivia.get(userId) === game && game.status === 'ACTIVE') {
          game.status = 'TIMEOUT';
          activeTrivia.delete(userId);
          if (game.messageId) {
            rest.editMessage(game.channelId, game.messageId, {
              embeds: game.getEmbed(),
              components: []
            }).catch(() => {});
          }
        }
      }, 25000);
    }
  },

  // --- SCRATCH CARD ---
  scratch: {
    name: 'scratch',
    aliases: ['lotto'],
    description: 'Scratch a 6-symbol lottery ticket. Match 3 symbols to win up to 20x!',
    usage: '!scratch <bet>',
    async execute({ rest, message, args, db }) {
      const user = db.getUser(message.author.id);
      const bet = parseBet(args[0], user);

      if (!bet || bet < 10) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Bet', 'Minimum ticket price is 🪙 **10** coins: `!scratch <bet>`')
        });
      }

      if (user.wallet < bet) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Insufficient Funds', `You only have 🪙 **${formatNumber(user.wallet)}** coins.`)
        });
      }

      user.wallet -= bet;

      const result = playScratchCard(bet);
      user.wallet += result.payout;

      if (result.win) {
        user.stats.slots_won = (user.stats.slots_won || 0) + 1;
      } else {
        user.stats.slots_lost = (user.stats.slots_lost || 0) + 1;
      }

      db.queueSave();

      return rest.sendMessage(message.channel_id, {
        embeds: result.embed
      });
    }
  },

  // --- WHEEL OF FORTUNE ---
  wheel: {
    name: 'wheel',
    aliases: ['spin'],
    description: 'Spin the Fortune Wheel every 2 hours to win jackpot coins, buffs, or items!',
    usage: '!wheel',
    async execute({ rest, message, db }) {
      const user = db.getUser(message.author.id);
      const now = Date.now();
      const cooldownMs = 2 * 60 * 60 * 1000; // 2 hours
      const lastSpin = user.cooldowns.wheel || 0;
      const elapsed = now - lastSpin;

      if (elapsed < cooldownMs) {
        const remaining = (cooldownMs - elapsed) / 1000;
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Wheel Cooldown', `⏳ The Wheel of Fortune is resetting! Spin again in **${formatTime(remaining)}**.`)
        });
      }

      user.cooldowns.wheel = now;
      const embed = spinFortuneWheel(user);
      db.queueSave();

      return rest.sendMessage(message.channel_id, {
        embeds: embed
      });
    }
  },

  // --- ROCK PAPER SCISSORS ---
  rps: {
    name: 'rps',
    description: 'Play Rock Paper Scissors against the bot with an optional coin bet.',
    usage: '!rps <rock|paper|scissors> [bet]',
    async execute({ rest, message, args, db }) {
      const choice = (args[0] || '').toLowerCase();
      const valid = ['rock', 'paper', 'scissors', 'r', 'p', 's'];

      if (!valid.includes(choice)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Choice', 'Choose rock, paper, or scissors: `!rps rock [bet]`')
        });
      }

      const normalized = choice.startsWith('r') ? 'rock' : choice.startsWith('p') ? 'paper' : 'scissors';
      const user = db.getUser(message.author.id);

      let bet = 0;
      if (args[1]) {
        bet = parseBet(args[1], user) || 0;
        if (user.wallet < bet) {
          return rest.sendMessage(message.channel_id, {
            embeds: errorEmbed('Insufficient Funds', `You only have 🪙 **${formatNumber(user.wallet)}** coins.`)
          });
        }
      }

      if (bet > 0) {
        user.wallet -= bet;
      }

      const result = playRPS(normalized, bet);
      if (bet > 0) {
        user.wallet += result.payout;
        db.queueSave();
      }

      return rest.sendMessage(message.channel_id, {
        embeds: result.embed
      });
    }
  },

  // --- PVP DUEL ---
  duel: {
    name: 'duel',
    description: 'Challenge another server member to a high-stakes combat showdown wager!',
    usage: '!duel @user <bet>',
    async execute({ rest, message, args, db }) {
      const targetId = parseUserId(args[0]);
      if (!targetId || targetId === message.author.id) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Opponent', 'Mention another player to challenge: `!duel @user <bet>`')
        });
      }

      const challenger = db.getUser(message.author.id);
      const target = db.getUser(targetId);

      const bet = parseBet(args[1], challenger);
      if (!bet || bet < 50) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Bet', 'Minimum duel wager is 🪙 **50** coins: `!duel @user 100`')
        });
      }

      if (challenger.wallet < bet) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Insufficient Funds', `You only have 🪙 **${formatNumber(challenger.wallet)}** coins.`)
        });
      }

      if (target.wallet < bet) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Opponent Too Poor', `<@${targetId}> doesn't have 🪙 **${formatNumber(bet)}** coins in their wallet!`)
        });
      }

      const duelId = `${message.author.id}_${targetId}_${Date.now()}`;
      activeDuels.set(duelId, {
        challengerId: message.author.id,
        targetId,
        bet,
        channelId: message.channel_id,
        status: 'PENDING'
      });

      const components = [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3, // Green
              label: 'Accept Duel ⚔️',
              custom_id: `duel_accept_${duelId}`
            },
            {
              type: 2,
              style: 4, // Red
              label: 'Decline ❌',
              custom_id: `duel_decline_${duelId}`
            }
          ]
        }
      ];

      return rest.sendMessage(message.channel_id, {
        embeds: createEmbed({
          title: '⚔️ PvP Combat Challenge!',
          description: `<@${message.author.id}> has challenged <@${targetId}> to a duel!\n\n` +
            `💰 **Stakes:** 🪙 **${formatNumber(bet)}** coins each (*Winner takes 🪙 **${formatNumber(bet * 2)}**!*)\n` +
            `<@${targetId}>, click **Accept Duel** below to fight!`,
          color: COLORS.WARNING,
          footer: 'Challenge expires in 45 seconds.'
        }),
        components
      });
    }
  }
};
