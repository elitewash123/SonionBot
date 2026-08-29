// ==========================================================
// Fun Minigames (Scratch Card, Fortune Wheel, Rock-Paper-Scissors, PvP Duel)
// ==========================================================

import { createEmbed, COLORS, formatNumber } from '../discord/embeds.js';

export const activeDuels = new Map();

// --- 1. SCRATCH CARD LOTTERY ---
export function playScratchCard(bet) {
  const SYMBOLS = ['💎', '💰', '7️⃣', '👑', '🌟', '🍒', '🍀'];
  const grid = [];

  // Decide if win occurs
  const rand = Math.random();
  let win = false;
  let winningSymbol = null;
  let multiplier = 0;

  if (rand < 0.04) {
    win = true;
    winningSymbol = '7️⃣';
    multiplier = 20; // 20x Jackpot
  } else if (rand < 0.10) {
    win = true;
    winningSymbol = '💎';
    multiplier = 10;
  } else if (rand < 0.22) {
    win = true;
    winningSymbol = '👑';
    multiplier = 5;
  } else if (rand < 0.40) {
    win = true;
    winningSymbol = '💰';
    multiplier = 2.5;
  }

  if (win) {
    // Fill 3 slots with winning symbol
    grid.push(winningSymbol, winningSymbol, winningSymbol);
    while (grid.length < 6) {
      const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      grid.push(sym);
    }
  } else {
    // Fill with random symbols without 3 matches
    const counts = {};
    while (grid.length < 6) {
      const sym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
      if ((counts[sym] || 0) < 2) {
        counts[sym] = (counts[sym] || 0) + 1;
        grid.push(sym);
      }
    }
  }

  // Shuffle grid
  for (let i = grid.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [grid[i], grid[j]] = [grid[j], grid[i]];
  }

  const payout = win ? Math.floor(bet * multiplier) : 0;

  const cardVisual = `
╔═════════════════════╗
║   🎫 LUCKY SCRATCH  ║
╠═════════════════════╣
║   [ ${grid[0]} ] [ ${grid[1]} ] [ ${grid[2]} ]   ║
║   [ ${grid[3]} ] [ ${grid[4]} ] [ ${grid[5]} ]   ║
╚═════════════════════╝`;

  let title = '🎫 Scratch Card Ticket';
  let color = win ? COLORS.SUCCESS : COLORS.ERROR;
  let description = cardVisual + '\n\n';

  if (win) {
    title = '🎉 LOTTERY WINNER! 🎉';
    description += `Matched 3x **${winningSymbol}**! You won 🪙 **${formatNumber(payout)}** coins (**${multiplier}x**)!`;
  } else {
    description += `No 3 matching symbols found. You lost 🪙 **${formatNumber(bet)}** coins.`;
  }

  return {
    win,
    payout,
    embed: createEmbed({
      title,
      description,
      color,
      footer: 'Play again with !scratch <bet>'
    })
  };
}

// --- 2. FORTUNE WHEEL ---
export function spinFortuneWheel(user) {
  const WEDGES = [
    { label: '🪙 10,000 Grand Jackpot', coins: 10000, weight: 2, icon: '🌟' },
    { label: '🪙 3,000 Gold Chest', coins: 3000, weight: 8, icon: '💰' },
    { label: '🪙 1,000 Coin Pouch', coins: 1000, weight: 20, icon: '🪙' },
    { label: '🪙 500 Pocket Money', coins: 500, weight: 30, icon: '🪙' },
    { label: '🧪 Four-Leaf Clover (+Luck Buff)', buff: 'lucky_clover', buffCount: 10, weight: 15, icon: '🍀' },
    { label: '⚡ Energy Elixir (-Cooldown Buff)', buff: 'energy_drink', buffCount: 15, weight: 15, icon: '⚡' },
    { label: '🔱 Golden Bait (+Fish Buff)', buff: 'golden_bait', buffCount: 5, weight: 10, icon: '🎣' }
  ];

  const total = WEDGES.reduce((sum, w) => sum + w.weight, 0);
  let roll = Math.random() * total;
  let prize = WEDGES[0];

  for (const w of WEDGES) {
    if (roll <= w.weight) {
      prize = w;
      break;
    }
    roll -= w.weight;
  }

  if (prize.coins) {
    user.wallet += prize.coins;
  }
  if (prize.buff) {
    user.buffs[prize.buff] = (user.buffs[prize.buff] || 0) + prize.buffCount;
  }

  const visualWheel = `
      ▲
  ╔═════════════════╗
  ║    🎡 WHEEL 🎡  ║
  ║  ➜  ${prize.icon} **${prize.label}**  ║
  ╚═════════════════╝`;

  return createEmbed({
    title: '🎡 Wheel of Fortune',
    description: `The wheel spins and stops at:\n${visualWheel}\n\n🎉 **Congratulations!** Your prize has been added to your account!`,
    color: COLORS.GOLD,
    footer: 'Spin again tomorrow or after your cooldown!'
  });
}

// --- 3. ROCK PAPER SCISSORS ---
export function playRPS(userChoice, bet = 0) {
  const choices = ['rock', 'paper', 'scissors'];
  const emojis = { rock: '🪨 Rock', paper: '📄 Paper', scissors: '✂️ Scissors' };
  const botChoice = choices[Math.floor(Math.random() * choices.length)];

  const cleanUser = userChoice.toLowerCase();
  let outcome = 'TIE'; // 'WIN', 'LOSE', 'TIE'

  if (cleanUser === botChoice) {
    outcome = 'TIE';
  } else if (
    (cleanUser === 'rock' && botChoice === 'scissors') ||
    (cleanUser === 'paper' && botChoice === 'rock') ||
    (cleanUser === 'scissors' && botChoice === 'paper')
  ) {
    outcome = 'WIN';
  } else {
    outcome = 'LOSE';
  }

  let title = '✂️ Rock Paper Scissors';
  let color = COLORS.WARNING;
  let description = `You chose: **${emojis[cleanUser] || cleanUser}**\nBot chose: **${emojis[botChoice]}**\n\n`;

  let payout = 0;
  if (outcome === 'WIN') {
    title = '🎉 You Won!';
    color = COLORS.SUCCESS;
    payout = bet * 2;
    description += bet > 0 ? `🏆 You beat the bot and won 🪙 **${formatNumber(payout)}** coins!` : '🏆 You beat the bot!';
  } else if (outcome === 'TIE') {
    title = '🤝 It\'s a Tie!';
    color = COLORS.WARNING;
    payout = bet;
    description += bet > 0 ? `It's a draw! Your bet of 🪙 **${formatNumber(bet)}** coins was refunded.` : 'It\'s a draw!';
  } else {
    title = '💥 You Lost!';
    color = COLORS.ERROR;
    payout = 0;
    description += bet > 0 ? `The bot outsmarted you! You lost 🪙 **${formatNumber(bet)}** coins.` : 'The bot won this round!';
  }

  return {
    outcome,
    payout,
    embed: createEmbed({
      title,
      description,
      color
    })
  };
}
