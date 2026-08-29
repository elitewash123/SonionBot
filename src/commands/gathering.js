// ==========================================================
// Gathering RPG Commands (!fish, !mine, !dig, !hunt)
// ==========================================================

import { executeGatheringAction } from '../games/gathering.js';
import { errorEmbed, formatTime } from '../discord/embeds.js';

const COOLDOWNS = {
  fish: 25,
  mine: 30,
  dig: 20,
  hunt: 35
};

export const gatheringCommands = {
  fish: {
    name: 'fish',
    description: 'Cast your fishing rod and catch marine creatures and treasure.',
    usage: '!fish',
    async execute({ rest, message, db }) {
      return handleGathering('fish', message, rest, db);
    }
  },

  mine: {
    name: 'mine',
    description: 'Mine deep underground caves for gems, crystals, and rare ores.',
    usage: '!mine',
    async execute({ rest, message, db }) {
      return handleGathering('mine', message, rest, db);
    }
  },

  dig: {
    name: 'dig',
    description: 'Excavate the earth with your shovel for fossils and buried chests.',
    usage: '!dig',
    async execute({ rest, message, db }) {
      return handleGathering('dig', message, rest, db);
    }
  },

  hunt: {
    name: 'hunt',
    description: 'Venture into the wilderness to hunt wild beasts and mythical dragons.',
    usage: '!hunt',
    async execute({ rest, message, db }) {
      return handleGathering('hunt', message, rest, db);
    }
  }
};

async function handleGathering(type, message, rest, db) {
  const userId = message.author.id;
  const user = db.getUser(userId);

  // Check cooldown
  const now = Date.now();
  let baseCdSeconds = COOLDOWNS[type] || 25;

  // Energy drink reduces cooldown by 40%
  if (user.buffs.energy_drink) {
    baseCdSeconds = Math.floor(baseCdSeconds * 0.6);
  }

  const lastUsed = user.cooldowns[type] || 0;
  const elapsed = (now - lastUsed) / 1000;

  if (elapsed < baseCdSeconds) {
    const remaining = baseCdSeconds - elapsed;
    return rest.sendMessage(message.channel_id, {
      embeds: errorEmbed('Taking a Breather', `⏳ You are exhausted! Please wait **${formatTime(remaining)}** before using \`!${type}\` again.`)
    });
  }

  // Update cooldown timestamp
  user.cooldowns[type] = now;

  // Reduce energy drink buff charges
  if (user.buffs.energy_drink) {
    user.buffs.energy_drink -= 1;
    if (user.buffs.energy_drink <= 0) delete user.buffs.energy_drink;
  }

  // Execute gathering
  const embed = executeGatheringAction({
    type,
    user,
    username: message.author.username
  });

  db.queueSave();

  return rest.sendMessage(message.channel_id, {
    embeds: embed
  });
}
