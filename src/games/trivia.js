// ==========================================================
// Interactive Trivia Game Engine with Discord Buttons
// ==========================================================

import { createEmbed, COLORS, formatNumber } from '../discord/embeds.js';

export const TRIVIA_QUESTIONS = [
  {
    q: 'Which element has the chemical symbol "Au"?',
    options: ['Silver', 'Gold', 'Copper', 'Argon'],
    correct: 1,
    category: 'Science'
  },
  {
    q: 'In Minecraft, what ore is required to upgrade Diamond armor to the highest tier?',
    options: ['Obsidian', 'Emerald', 'Netherite', 'Amethyst'],
    correct: 2,
    category: 'Gaming'
  },
  {
    q: 'Which planet in our solar system is known as the "Red Planet"?',
    options: ['Venus', 'Mars', 'Jupiter', 'Mercury'],
    correct: 1,
    category: 'Space'
  },
  {
    q: 'What is the highest-grossing film of all time (unadjusted for inflation)?',
    options: ['Titanic', 'Avengers: Endgame', 'Avatar', 'Star Wars: The Force Awakens'],
    correct: 2,
    category: 'Pop Culture'
  },
  {
    q: 'In what year was the first Bitcoin block mined?',
    options: ['2007', '2008', '2009', '2011'],
    correct: 2,
    category: 'Technology'
  },
  {
    q: 'Which video game features the characters Geralt, Ciri, and Yennefer?',
    options: ['The Elder Scrolls V: Skyrim', 'The Witcher 3: Wild Hunt', 'Dark Souls', 'Dragon Age: Inquisition'],
    correct: 1,
    category: 'Gaming'
  },
  {
    q: 'What is the rarest blood type in humans?',
    options: ['O Negative', 'AB Negative', 'B Positive', 'A Negative'],
    correct: 1,
    category: 'Biology'
  },
  {
    q: 'Who was the ancient Greek god of the sea?',
    options: ['Zeus', 'Hades', 'Poseidon', 'Ares'],
    correct: 2,
    category: 'Mythology'
  },
  {
    q: 'What is the fastest land animal in the world?',
    options: ['Pronghorn Antelope', 'Cheetah', 'Lion', 'Sailfish'],
    correct: 1,
    category: 'Nature'
  },
  {
    q: 'Which company developed the Python programming language originally?',
    options: ['Guido van Rossum (CWI)', 'Google', 'Sun Microsystems', 'Microsoft'],
    correct: 0,
    category: 'Programming'
  },
  {
    q: 'In the Pokémon franchise, which Pokémon is numbered #001 in the National Pokédex?',
    options: ['Pikachu', 'Charmander', 'Bulbasaur', 'Squirtle'],
    correct: 2,
    category: 'Gaming'
  },
  {
    q: 'How many hearts does an octopus have?',
    options: ['1', '2', '3', '4'],
    correct: 2,
    category: 'Nature'
  }
];

export const activeTrivia = new Map();

export class TriviaGame {
  constructor(userId, username, channelId) {
    this.userId = userId;
    this.username = username;
    this.channelId = channelId;
    this.question = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];
    this.reward = 200 + Math.floor(Math.random() * 150);
    this.status = 'ACTIVE'; // 'ACTIVE', 'CORRECT', 'WRONG', 'TIMEOUT'
    this.selectedOption = null;
    this.messageId = null;
    this.startTime = Date.now();
  }

  getEmbed() {
    let color = COLORS.INFO;
    let title = `🧠 Trivia Challenge — [${this.question.category}]`;
    let description = `**Question:**\n### ${this.question.q}\n\n`;

    const labels = ['A', 'B', 'C', 'D'];
    this.question.options.forEach((opt, idx) => {
      let icon = `\`[ ${labels[idx]} ]\``;
      if (this.status !== 'ACTIVE') {
        if (idx === this.question.correct) icon = '✅';
        else if (idx === this.selectedOption) icon = '❌';
      }
      description += `${icon} **${opt}**\n`;
    });

    if (this.status === 'CORRECT') {
      title = '🎉 Correct Answer!';
      color = COLORS.SUCCESS;
      description += `\n🌟 **Brilliant!** You earned 🪙 **${formatNumber(this.reward)}** coins!`;
    } else if (this.status === 'WRONG') {
      title = '❌ Wrong Answer!';
      color = COLORS.ERROR;
      description += `\nBetter luck next time! The correct answer was **${this.question.options[this.question.correct]}**.`;
    } else if (this.status === 'TIMEOUT') {
      title = '⏰ Time Expired!';
      color = COLORS.WARNING;
      description += `\nTime is up! The correct answer was **${this.question.options[this.question.correct]}**.`;
    } else {
      description += `\n*Reward:* 🪙 **${formatNumber(this.reward)}** coins • *Time:* **25 seconds**`;
    }

    return createEmbed({
      title,
      description,
      color,
      footer: this.status === 'ACTIVE' ? 'Click a button below to submit your answer!' : 'Trivia ended.'
    });
  }

  getComponents() {
    if (this.status !== 'ACTIVE') return [];

    const labels = ['A', 'B', 'C', 'D'];
    const buttons = this.question.options.map((opt, idx) => ({
      type: 2, // Button
      style: 1, // Primary (Blurple)
      label: `${labels[idx]}: ${opt.length > 20 ? opt.slice(0, 18) + '...' : opt}`,
      custom_id: `trivia_ans_${this.userId}_${idx}`
    }));

    return [
      {
        type: 1,
        components: buttons.slice(0, 2)
      },
      {
        type: 1,
        components: buttons.slice(2, 4)
      }
    ];
  }
}
