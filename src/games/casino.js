// ==========================================================
// Casino Minigames (Slots, Coinflip, Roulette, Dice)
// ==========================================================

import { createEmbed, COLORS, formatNumber } from '../discord/embeds.js';

const SLOT_SYMBOLS = [
  { symbol: '🍒', weight: 35, multiplier: 2.5 },
  { symbol: '🍋', weight: 28, multiplier: 3.0 },
  { symbol: '🍇', weight: 20, multiplier: 4.0 },
  { symbol: '🔔', weight: 12, multiplier: 6.0 },
  { symbol: '🌟', weight: 6, multiplier: 10.0 },
  { symbol: '💎', weight: 3, multiplier: 15.0 },
  { symbol: '7️⃣', weight: 1, multiplier: 25.0 }
];

function pickSlotSymbol() {
  const total = SLOT_SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let r = Math.random() * total;
  for (const sym of SLOT_SYMBOLS) {
    if (r <= sym.weight) return sym;
    r -= sym.weight;
  }
  return SLOT_SYMBOLS[0];
}

export function playSlots(bet) {
  const r1 = pickSlotSymbol();
  const r2 = pickSlotSymbol();
  const r3 = pickSlotSymbol();

  let win = false;
  let multiplier = 0;
  let outcome = 'LOSS';

  // Check 3 matching
  if (r1.symbol === r2.symbol && r2.symbol === r3.symbol) {
    win = true;
    multiplier = r1.multiplier;
    outcome = r1.symbol === '7️⃣' ? 'JACKPOT' : 'TRIPLE';
  } else if (r1.symbol === r2.symbol || r2.symbol === r3.symbol || r1.symbol === r3.symbol) {
    // 2 matching
    win = true;
    multiplier = 1.4;
    outcome = 'PAIR';
  }

  const payout = win ? Math.floor(bet * multiplier) : 0;
  const net = payout - bet;

  let title = '🎰 Royal Slots Machine';
  let color = COLORS.ERROR;
  let description = '';

  if (outcome === 'JACKPOT') {
    title = '🔥 JACKPOT! 777 JACKPOT! 🔥';
    color = COLORS.GOLD;
    description = `🎉 **UNBELIEVABLE!** You hit the **777 Jackpot** and won 🪙 **${formatNumber(payout)}** coins (**${multiplier}x**)!`;
  } else if (outcome === 'TRIPLE') {
    title = '💎 TRIPLE WIN! 💎';
    color = COLORS.SUCCESS;
    description = `🎉 Triple match! You won 🪙 **${formatNumber(payout)}** coins (**${multiplier}x**)!`;
  } else if (outcome === 'PAIR') {
    title = '✨ Pair Match!';
    color = COLORS.SUCCESS;
    description = `Two matching symbols! You won 🪙 **${formatNumber(payout)}** coins (**1.4x**)!`;
  } else {
    description = `Better luck next time! You lost 🪙 **${formatNumber(bet)}** coins.`;
  }

  const visualReels = `
╔═════════════════╗
║  [ ${r1.symbol} ] [ ${r2.symbol} ] [ ${r3.symbol} ]  ║
╚═════════════════╝`;

  return {
    win,
    payout,
    net,
    embed: createEmbed({
      title,
      description: `${visualReels}\n\n${description}`,
      color,
      footer: 'Spin again with !slots <bet>'
    })
  };
}

export function playCoinflip(choice, bet) {
  const normalizedChoice = choice.toLowerCase().startsWith('h') ? 'heads' : 'tails';
  const flip = Math.random() < 0.5 ? 'heads' : 'tails';
  const win = normalizedChoice === flip;
  const payout = win ? bet * 2 : 0;

  const emoji = flip === 'heads' ? '🪙 (Heads)' : '🪙 (Tails)';

  return {
    win,
    payout,
    net: payout - bet,
    embed: createEmbed({
      title: win ? '🎉 Coinflip Victory!' : '💥 Coinflip Defeat',
      description: `The coin landed on **${emoji}**!\n\n` +
        (win
          ? `You guessed **${normalizedChoice.toUpperCase()}** correctly and won 🪙 **${formatNumber(payout)}** coins!`
          : `You guessed **${normalizedChoice.toUpperCase()}** but the coin landed on **${flip.toUpperCase()}**. You lost 🪙 **${formatNumber(bet)}** coins.`),
      color: win ? COLORS.SUCCESS : COLORS.ERROR
    })
  };
}

export function playRoulette(betChoice, bet) {
  const number = Math.floor(Math.random() * 37); // 0 to 36
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  
  let color = 'black';
  if (number === 0) color = 'green';
  else if (redNumbers.includes(number)) color = 'red';

  let win = false;
  let multiplier = 0;

  const choice = betChoice.toLowerCase();

  if (choice === 'red' && color === 'red') {
    win = true;
    multiplier = 2;
  } else if (choice === 'black' && color === 'black') {
    win = true;
    multiplier = 2;
  } else if (choice === 'green' && color === 'green') {
    win = true;
    multiplier = 14;
  } else if (!isNaN(parseInt(choice, 10)) && parseInt(choice, 10) === number) {
    win = true;
    multiplier = 36;
  }

  const payout = win ? bet * multiplier : 0;
  const colorEmoji = color === 'red' ? '🔴' : color === 'black' ? '⚫' : '🟢';

  return {
    win,
    payout,
    net: payout - bet,
    embed: createEmbed({
      title: '🎡 Roulette Wheel',
      description: `The roulette ball landed on **${colorEmoji} ${number} (${color.toUpperCase()})**!\n\n` +
        (win
          ? `🎉 **You Won!** Your bet on **${choice.toUpperCase()}** paid out 🪙 **${formatNumber(payout)}** coins (**${multiplier}x**)!`
          : `💥 **You Lost!** Better luck next spin. You lost 🪙 **${formatNumber(bet)}** coins.`),
      color: win ? COLORS.SUCCESS : COLORS.ERROR
    })
  };
}

export function playDice(bet) {
  const playerRoll1 = Math.floor(Math.random() * 6) + 1;
  const playerRoll2 = Math.floor(Math.random() * 6) + 1;
  const playerTotal = playerRoll1 + playerRoll2;

  const botRoll1 = Math.floor(Math.random() * 6) + 1;
  const botRoll2 = Math.floor(Math.random() * 6) + 1;
  const botTotal = botRoll1 + botRoll2;

  let win = false;
  let push = false;
  let payout = 0;

  if (playerTotal > botTotal) {
    win = true;
    payout = bet * 2;
  } else if (playerTotal === botTotal) {
    push = true;
    payout = bet;
  }

  let title = '🎲 High-Stakes Dice Roll';
  let color = COLORS.ERROR;
  let description = `🎲 Your Roll: **[ ${playerRoll1} ] [ ${playerRoll2} ]** = **${playerTotal}**\n` +
                    `🤖 Dealer Roll: **[ ${botRoll1} ] [ ${botRoll2} ]** = **${botTotal}**\n\n`;

  if (win) {
    title = '🎉 Dice Victory!';
    color = COLORS.SUCCESS;
    description += `You rolled higher and won 🪙 **${formatNumber(payout)}** coins!`;
  } else if (push) {
    title = '🤝 Dice Tie';
    color = COLORS.WARNING;
    description += `It's a draw! Your bet of 🪙 **${formatNumber(bet)}** coins was refunded.`;
  } else {
    description += `Dealer rolled higher. You lost 🪙 **${formatNumber(bet)}** coins.`;
  }

  return {
    win,
    push,
    payout,
    net: payout - bet,
    embed: createEmbed({
      title,
      description,
      color
    })
  };
}
