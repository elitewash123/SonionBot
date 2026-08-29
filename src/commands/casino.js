// ==========================================================
// Casino & Gambling Commands (Blackjack, Slots, Coinflip, Roulette, Dice)
// ==========================================================

import { BlackjackGame, activeGames } from '../games/blackjack.js';
import { playSlots, playCoinflip, playRoulette, playDice } from '../games/casino.js';
import { createEmbed, errorEmbed, COLORS, formatNumber } from '../discord/embeds.js';

export function parseBet(arg, user) {
  if (!arg) return null;
  if (arg.toLowerCase() === 'all' || arg.toLowerCase() === 'max') {
    return Math.min(user.wallet, 50000); // Cap max bet
  }
  if (arg.toLowerCase() === 'half') {
    return Math.floor(user.wallet / 2);
  }
  const num = parseInt(arg, 10);
  if (isNaN(num) || num <= 0) return null;
  return num;
}

export const casinoCommands = {
  // --- BLACKJACK ---
  blackjack: {
    name: 'blackjack',
    aliases: ['bj'],
    description: 'Play a game of Blackjack with interactive Discord buttons against the dealer.',
    usage: '!blackjack <bet>',
    async execute({ rest, message, args, db }) {
      const userId = message.author.id;
      const user = db.getUser(userId);

      if (activeGames.has(userId)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Game in Progress', 'You already have an active Blackjack game! Use the buttons or `!hit` / `!stand`.')
        });
      }

      const bet = parseBet(args[0], user);
      if (!bet || bet < 10) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Bet', 'Minimum bet is 🪙 **10** coins. Usage: `!blackjack <bet|all>`')
        });
      }

      if (user.wallet < bet) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Insufficient Funds', `You only have 🪙 **${formatNumber(user.wallet)}** coins in your wallet.`)
        });
      }

      // Deduct bet from wallet
      user.wallet -= bet;
      db.queueSave();

      const game = new BlackjackGame(userId, message.author.username, bet, message.channel_id);

      // Check if natural blackjack or immediate end
      if (game.status !== 'IN_PROGRESS') {
        user.wallet += game.payout;
        if (game.payout > bet) {
          user.stats.bj_won = (user.stats.bj_won || 0) + 1;
        } else if (game.payout < bet) {
          user.stats.bj_lost = (user.stats.bj_lost || 0) + 1;
        }
        db.queueSave();

        return rest.sendMessage(message.channel_id, {
          embeds: game.getEmbed(),
          components: []
        });
      }

      activeGames.set(userId, game);

      const msg = await rest.sendMessage(message.channel_id, {
        embeds: game.getEmbed(),
        components: game.getComponents()
      });

      if (msg && msg.id) {
        game.messageId = msg.id;
      }

      // Auto-expire game after 60 seconds of inactivity
      setTimeout(() => {
        if (activeGames.has(userId) && activeGames.get(userId) === game) {
          activeGames.delete(userId);
          // Stand automatically
          game.stand();
          user.wallet += game.payout;
          db.queueSave();
          if (game.messageId) {
            rest.editMessage(game.channelId, game.messageId, {
              embeds: game.getEmbed(),
              components: []
            }).catch(() => {});
          }
        }
      }, 60000);
    }
  },

  // Fallback text commands for blackjack
  hit: {
    name: 'hit',
    description: 'Draw another card in your active Blackjack game.',
    usage: '!hit',
    async execute({ rest, message, db }) {
      return handleBlackjackAction(message.author.id, 'hit', rest, db);
    }
  },

  stand: {
    name: 'stand',
    description: 'End your turn and let the dealer play in Blackjack.',
    usage: '!stand',
    async execute({ rest, message, db }) {
      return handleBlackjackAction(message.author.id, 'stand', rest, db);
    }
  },

  double: {
    name: 'double',
    aliases: ['dd'],
    description: 'Double down your bet and draw exactly one card in Blackjack.',
    usage: '!double',
    async execute({ rest, message, db }) {
      return handleBlackjackAction(message.author.id, 'double', rest, db);
    }
  },

  // --- SLOTS ---
  slots: {
    name: 'slots',
    description: 'Spin the 3-reel slot machine for huge multipliers up to 25x.',
    usage: '!slots <bet>',
    async execute({ rest, message, args, db }) {
      const user = db.getUser(message.author.id);
      const bet = parseBet(args[0], user);

      if (!bet || bet < 10) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Bet', 'Minimum bet is 🪙 **10** coins. Usage: `!slots <bet|all>`')
        });
      }

      if (user.wallet < bet) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Insufficient Funds', `You only have 🪙 **${formatNumber(user.wallet)}** coins.`)
        });
      }

      user.wallet -= bet;

      const result = playSlots(bet);
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

  // --- COINFLIP ---
  coinflip: {
    name: 'coinflip',
    aliases: ['cf'],
    description: 'Flip a coin with 50/50 double-or-nothing payout.',
    usage: '!coinflip <heads|tails> <bet>',
    async execute({ rest, message, args, db }) {
      const user = db.getUser(message.author.id);
      const choice = (args[0] || '').toLowerCase();

      if (!['heads', 'tails', 'h', 't'].includes(choice)) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Side', 'Choose heads or tails: `!coinflip <heads|tails> <bet>`')
        });
      }

      const bet = parseBet(args[1], user);
      if (!bet || bet < 10) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Bet', 'Minimum bet is 🪙 **10** coins.')
        });
      }

      if (user.wallet < bet) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Insufficient Funds', `You only have 🪙 **${formatNumber(user.wallet)}** coins.`)
        });
      }

      user.wallet -= bet;

      const result = playCoinflip(choice, bet);
      user.wallet += result.payout;
      db.queueSave();

      return rest.sendMessage(message.channel_id, {
        embeds: result.embed
      });
    }
  },

  // --- ROULETTE ---
  roulette: {
    name: 'roulette',
    description: 'Bet on Red (2x), Black (2x), Green (14x), or a specific number 0-36 (36x)!',
    usage: '!roulette <red|black|green|0-36> <bet>',
    async execute({ rest, message, args, db }) {
      const user = db.getUser(message.author.id);
      const choice = (args[0] || '').toLowerCase();

      const validChoices = ['red', 'black', 'green'];
      const isNum = !isNaN(parseInt(choice, 10)) && parseInt(choice, 10) >= 0 && parseInt(choice, 10) <= 36;

      if (!validChoices.includes(choice) && !isNum) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Choice', 'Bet on `red`, `black`, `green`, or a number `0-36`: `!roulette red 100`')
        });
      }

      const bet = parseBet(args[1], user);
      if (!bet || bet < 10) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Bet', 'Minimum bet is 🪙 **10** coins.')
        });
      }

      if (user.wallet < bet) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Insufficient Funds', `You only have 🪙 **${formatNumber(user.wallet)}** coins.`)
        });
      }

      user.wallet -= bet;

      const result = playRoulette(choice, bet);
      user.wallet += result.payout;
      db.queueSave();

      return rest.sendMessage(message.channel_id, {
        embeds: result.embed
      });
    }
  },

  // --- DICE ---
  dice: {
    name: 'dice',
    description: 'Roll 2 dice against the dealer for double payout.',
    usage: '!dice <bet>',
    async execute({ rest, message, args, db }) {
      const user = db.getUser(message.author.id);
      const bet = parseBet(args[0], user);

      if (!bet || bet < 10) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Invalid Bet', 'Minimum bet is 🪙 **10** coins.')
        });
      }

      if (user.wallet < bet) {
        return rest.sendMessage(message.channel_id, {
          embeds: errorEmbed('Insufficient Funds', `You only have 🪙 **${formatNumber(user.wallet)}** coins.`)
        });
      }

      user.wallet -= bet;

      const result = playDice(bet);
      user.wallet += result.payout;
      db.queueSave();

      return rest.sendMessage(message.channel_id, {
        embeds: result.embed
      });
    }
  }
};

/**
 * Handles Blackjack Action (called by text commands or button interactions)
 */
export async function handleBlackjackAction(userId, action, rest, db, interaction = null) {
  const game = activeGames.get(userId);
  if (!game) {
    if (interaction) {
      return rest.interactionCallback(interaction.id, interaction.token, {
        type: 4,
        data: {
          embeds: [errorEmbed('No Game Active', 'This Blackjack game has ended or expired.')],
          flags: 64 // Ephemeral
        }
      });
    }
    return;
  }

  const user = db.getUser(userId);

  if (action === 'hit') {
    game.hit();
  } else if (action === 'stand') {
    game.stand();
  } else if (action === 'double') {
    const success = game.doubleDown(user);
    if (!success && interaction) {
      return rest.interactionCallback(interaction.id, interaction.token, {
        type: 4,
        data: {
          embeds: [errorEmbed('Cannot Double Down', 'You do not have enough coins in your wallet to double your bet!')],
          flags: 64
        }
      });
    }
  }

  // If game finished, handle payouts
  if (game.status !== 'IN_PROGRESS') {
    activeGames.delete(userId);
    user.wallet += game.payout;

    if (game.payout > game.bet) {
      user.stats.bj_won = (user.stats.bj_won || 0) + 1;
    } else if (game.payout < game.bet) {
      user.stats.bj_lost = (user.stats.bj_lost || 0) + 1;
    }
    db.queueSave();
  }

  const newEmbed = game.getEmbed();
  const newComponents = game.getComponents();

  if (interaction) {
    // Acknowledge button interaction by updating message
    return rest.interactionCallback(interaction.id, interaction.token, {
      type: 7, // UPDATE_MESSAGE
      data: {
        embeds: [newEmbed],
        components: newComponents
      }
    });
  } else if (game.messageId) {
    return rest.editMessage(game.channelId, game.messageId, {
      embeds: newEmbed,
      components: newComponents
    });
  }
}
