// ==========================================================
// Interactive Blackjack Engine with Discord Buttons
// ==========================================================

import { createEmbed, COLORS, formatNumber } from '../discord/embeds.js';

const SUITS = ['♠', '♥', '♦', '♣'];
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Active games keyed by userId
export const activeGames = new Map();

export class BlackjackGame {
  constructor(userId, username, bet, channelId) {
    this.userId = userId;
    this.username = username;
    this.bet = bet;
    this.channelId = channelId;
    this.deck = this.createDeck();
    this.playerHand = [];
    this.dealerHand = [];
    this.status = 'IN_PROGRESS'; // 'IN_PROGRESS', 'PLAYER_BUST', 'DEALER_BUST', 'PLAYER_WIN', 'DEALER_WIN', 'PUSH', 'BLACKJACK'
    this.payout = 0;
    this.messageId = null;
    this.startedAt = Date.now();
    this.dealInitialCards();
  }

  createDeck() {
    const deck = [];
    for (const suit of SUITS) {
      for (const val of VALUES) {
        deck.push({ suit, val });
      }
    }
    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  drawCard() {
    if (this.deck.length === 0) {
      this.deck = this.createDeck();
    }
    return this.deck.pop();
  }

  dealInitialCards() {
    this.playerHand.push(this.drawCard());
    this.dealerHand.push(this.drawCard());
    this.playerHand.push(this.drawCard());
    this.dealerHand.push(this.drawCard());

    const playerScore = this.calculateScore(this.playerHand);
    const dealerScore = this.calculateScore(this.dealerHand);

    if (playerScore === 21 && dealerScore === 21) {
      this.status = 'PUSH';
      this.payout = this.bet;
    } else if (playerScore === 21) {
      this.status = 'BLACKJACK';
      this.payout = Math.floor(this.bet * 2.5); // 3:2 payout
    }
  }

  calculateScore(hand) {
    let score = 0;
    let aces = 0;

    for (const card of hand) {
      if (['J', 'Q', 'K'].includes(card.val)) {
        score += 10;
      } else if (card.val === 'A') {
        aces += 1;
        score += 11;
      } else {
        score += parseInt(card.val, 10);
      }
    }

    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }

    return score;
  }

  hit() {
    if (this.status !== 'IN_PROGRESS') return;
    this.playerHand.push(this.drawCard());
    const score = this.calculateScore(this.playerHand);
    if (score > 21) {
      this.status = 'PLAYER_BUST';
      this.payout = 0;
    } else if (score === 21) {
      this.stand();
    }
  }

  stand() {
    if (this.status !== 'IN_PROGRESS') return;

    // Dealer must draw until reaching at least 17
    while (this.calculateScore(this.dealerHand) < 17) {
      this.dealerHand.push(this.drawCard());
    }

    const playerScore = this.calculateScore(this.playerHand);
    const dealerScore = this.calculateScore(this.dealerHand);

    if (dealerScore > 21) {
      this.status = 'DEALER_BUST';
      this.payout = this.bet * 2;
    } else if (playerScore > dealerScore) {
      this.status = 'PLAYER_WIN';
      this.payout = this.bet * 2;
    } else if (playerScore < dealerScore) {
      this.status = 'DEALER_WIN';
      this.payout = 0;
    } else {
      this.status = 'PUSH';
      this.payout = this.bet;
    }
  }

  doubleDown(user) {
    if (this.status !== 'IN_PROGRESS' || this.playerHand.length !== 2) return false;
    if (user.wallet < this.bet) return false;

    user.wallet -= this.bet;
    this.bet *= 2;

    this.playerHand.push(this.drawCard());
    const score = this.calculateScore(this.playerHand);

    if (score > 21) {
      this.status = 'PLAYER_BUST';
      this.payout = 0;
    } else {
      this.stand();
    }
    return true;
  }

  formatCards(hand, hideFirst = false) {
    if (hideFirst) {
      const visible = hand.slice(1).map(c => `\`[${c.val}${c.suit}]\``).join(' ');
      return `\`[ ? ]\` ${visible}`;
    }
    return hand.map(c => `\`[${c.val}${c.suit}]\``).join(' ');
  }

  getEmbed() {
    const inProgress = this.status === 'IN_PROGRESS';
    const playerScore = this.calculateScore(this.playerHand);
    const dealerScore = inProgress
      ? this.calculateScore(this.dealerHand.slice(1))
      : this.calculateScore(this.dealerHand);

    let title = '🃏 Blackjack Table';
    let color = COLORS.GOLD;
    let description = `Player: **${this.username}** | Total Bet: 🪙 **${formatNumber(this.bet)}**\n`;

    switch (this.status) {
      case 'BLACKJACK':
        title = '🃏 NATURAL BLACKJACK! 🌟';
        color = COLORS.SUCCESS;
        description += `💥 **Blackjack!** You won 🪙 **${formatNumber(this.payout)}** coins (3:2 Payout)!`;
        break;
      case 'PLAYER_WIN':
        title = '🎉 You Won!';
        color = COLORS.SUCCESS;
        description += `🏆 You beat the dealer and collected 🪙 **${formatNumber(this.payout)}** coins!`;
        break;
      case 'DEALER_BUST':
        title = '💥 Dealer Busted!';
        color = COLORS.SUCCESS;
        description += `🎉 The dealer went over 21! You won 🪙 **${formatNumber(this.payout)}** coins!`;
        break;
      case 'PUSH':
        title = '🤝 Push / Tie';
        color = COLORS.WARNING;
        description += `Equal hands. Your bet of 🪙 **${formatNumber(this.bet)}** has been returned.`;
        break;
      case 'PLAYER_BUST':
        title = '💥 Busted!';
        color = COLORS.ERROR;
        description += `You exceeded 21 and lost 🪙 **${formatNumber(this.bet)}** coins.`;
        break;
      case 'DEALER_WIN':
        title = '📉 House Wins';
        color = COLORS.ERROR;
        description += `The dealer had a higher score. You lost 🪙 **${formatNumber(this.bet)}** coins.`;
        break;
      default:
        description += `*Choose your action below using the interactive buttons.*`;
        break;
    }

    const fields = [
      {
        name: `👤 Your Hand (${playerScore})`,
        value: this.formatCards(this.playerHand),
        inline: true
      },
      {
        name: `🎩 Dealer Hand (${inProgress ? `? + ${dealerScore}` : dealerScore})`,
        value: this.formatCards(this.dealerHand, inProgress),
        inline: true
      }
    ];

    return createEmbed({
      title,
      description,
      color,
      fields,
      footer: inProgress ? 'Buttons will expire in 60 seconds.' : 'Game concluded.'
    });
  }

  getComponents() {
    if (this.status !== 'IN_PROGRESS') {
      return []; // No buttons when game has ended
    }

    const allowDouble = this.playerHand.length === 2;

    const buttons = [
      {
        type: 2, // Button
        style: 1, // Primary (Blurple)
        label: 'Hit 🃏',
        custom_id: `bj_hit_${this.userId}`
      },
      {
        type: 2,
        style: 2, // Secondary (Grey)
        label: 'Stand 🛑',
        custom_id: `bj_stand_${this.userId}`
      }
    ];

    if (allowDouble) {
      buttons.push({
        type: 2,
        style: 3, // Success (Green)
        label: 'Double Down 💰',
        custom_id: `bj_double_${this.userId}`
      });
    }

    return [
      {
        type: 1, // ActionRow
        components: buttons
      }
    ];
  }
}
