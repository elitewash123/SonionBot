// ==========================================================
// Interactive Casino Crash Game Engine with Real-Time Cash Out
// ==========================================================

import { createEmbed, COLORS, formatNumber } from '../discord/embeds.js';

export const activeCrashGames = new Map();

export class CrashGame {
  constructor(userId, username, bet, channelId, rest, db) {
    this.userId = userId;
    this.username = username;
    this.bet = bet;
    this.channelId = channelId;
    this.rest = rest;
    this.db = db;
    this.multiplier = 1.00;
    this.crashPoint = this.generateCrashPoint();
    this.status = 'FLYING'; // 'FLYING', 'CASHED_OUT', 'CRASHED'
    this.messageId = null;
    this.interval = null;
    this.cashedOutMultiplier = 0;
  }

  generateCrashPoint() {
    // Standard provably-fair crash curve
    const r = Math.random();
    if (r < 0.05) return 1.00; // 5% instant crash
    const e = 100 / (101 - Math.floor(r * 101));
    const result = Math.max(1.01, Math.min(100.0, e * (1 + Math.random() * 0.5)));
    return parseFloat(result.toFixed(2));
  }

  getEmbed() {
    let title = '🚀 Rocket Crash Game';
    let color = COLORS.INFO;
    let description = '';

    const rocketAscii = `
     ▲
    ╱ ╲
   ╱ 🚀 ╲     **Multiplier: ${this.multiplier.toFixed(2)}x**
  ╱     ╲    *Current Win: 🪙 ${formatNumber(this.bet * this.multiplier)}*
 ╱_______╲
  ▒ ▒ ▒ ▒
  🔥 🔥 🔥`;

    if (this.status === 'FLYING') {
      description = `${rocketAscii}\n\n*The rocket is ascending! Click **Cash Out** below before it crashes!*`;
    } else if (this.status === 'CASHED_OUT') {
      title = '🎉 Cashed Out Successfully!';
      color = COLORS.SUCCESS;
      const profit = Math.floor(this.bet * this.cashedOutMultiplier);
      description = `
     ▲
    ╱ 💰 ╲    **Cashed Out At: ${this.cashedOutMultiplier.toFixed(2)}x**
   ╱_______╲   *Payout:* 🪙 **${formatNumber(profit)}** coins
   
🏆 **Awesome timing!** You secured 🪙 **${formatNumber(profit)}** coins before the rocket crashed at **${this.crashPoint.toFixed(2)}x**!`;
    } else if (this.status === 'CRASHED') {
      title = '💥 CRASHED! 💥';
      color = COLORS.ERROR;
      description = `
     💥 💥 💥
   💥  🌋  💥   **Crashed At: ${this.crashPoint.toFixed(2)}x**
     💥 💥 💥
     
The rocket exploded in orbit! You lost your bet of 🪙 **${formatNumber(this.bet)}** coins.`;
    }

    return createEmbed({
      title,
      description,
      color,
      footer: `Player: ${this.username} | Bet: ${formatNumber(this.bet)} coins`
    });
  }

  getComponents() {
    if (this.status !== 'FLYING') return [];

    return [
      {
        type: 1,
        components: [
          {
            type: 2, // Button
            style: 3, // Success (Green)
            label: `Cash Out 💰 (${this.multiplier.toFixed(2)}x)`,
            custom_id: `crash_cashout_${this.userId}`
          }
        ]
      }
    ];
  }

  async start() {
    const sent = await this.rest.sendMessage(this.channelId, {
      embeds: this.getEmbed(),
      components: this.getComponents()
    });

    if (sent && sent.id) {
      this.messageId = sent.id;
    }

    this.interval = setInterval(async () => {
      if (this.status !== 'FLYING') {
        clearInterval(this.interval);
        return;
      }

      // Increment multiplier smoothly
      const step = this.multiplier < 2.0 ? 0.20 : this.multiplier < 5.0 ? 0.45 : 0.85;
      this.multiplier = parseFloat((this.multiplier + step).toFixed(2));

      if (this.multiplier >= this.crashPoint) {
        // Crashed
        this.status = 'CRASHED';
        clearInterval(this.interval);
        activeCrashGames.delete(this.userId);

        const user = this.db.getUser(this.userId);
        user.stats.slots_lost = (user.stats.slots_lost || 0) + 1;
        this.db.queueSave();

        if (this.messageId) {
          await this.rest.editMessage(this.channelId, this.messageId, {
            embeds: this.getEmbed(),
            components: []
          }).catch(() => {});
        }
        return;
      }

      // Update message with current multiplier
      if (this.messageId) {
        await this.rest.editMessage(this.channelId, this.messageId, {
          embeds: this.getEmbed(),
          components: this.getComponents()
        }).catch(() => {});
      }
    }, 1800);
  }

  cashOut(interaction = null) {
    if (this.status !== 'FLYING') return;

    this.status = 'CASHED_OUT';
    this.cashedOutMultiplier = this.multiplier;
    clearInterval(this.interval);
    activeCrashGames.delete(this.userId);

    const user = this.db.getUser(this.userId);
    const payout = Math.floor(this.bet * this.cashedOutMultiplier);
    user.wallet += payout;
    user.stats.slots_won = (user.stats.slots_won || 0) + 1;
    this.db.queueSave();

    const embed = this.getEmbed();

    if (interaction) {
      return this.rest.interactionCallback(interaction.id, interaction.token, {
        type: 7, // UPDATE_MESSAGE
        data: {
          embeds: [embed],
          components: []
        }
      });
    } else if (this.messageId) {
      return this.rest.editMessage(this.channelId, this.messageId, {
        embeds: embed,
        components: []
      });
    }
  }
}
