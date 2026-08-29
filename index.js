// ==========================================================
// SonionBot - Standalone Discord Bot (Zero node_modules)
// ==========================================================

import fs from 'node:fs';
import path from 'node:path';
import { DiscordRestClient } from './src/discord/rest.js';
import { DiscordGatewayClient } from './src/discord/gateway.js';
import { Database } from './src/db/database.js';
import { handleMessage, handleInteraction } from './src/commands/index.js';

// Simple native .env file reader (Zero Dependencies)
function loadEnv() {
  const envPath = path.resolve('./.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...rest] = trimmed.split('=');
        if (key && rest.length) {
          process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  }
}

loadEnv();

// Load config.json
let config = {
  token: process.env.DISCORD_TOKEN || 'YOUR_DISCORD_BOT_TOKEN_HERE',
  prefix: process.env.BOT_PREFIX || '!',
  adminIds: process.env.ADMIN_IDS ? process.env.ADMIN_IDS.split(',').map(s => s.trim()) : []
};

const configPath = path.resolve('./config.json');
if (fs.existsSync(configPath)) {
  try {
    const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config = { ...config, ...fileConfig };
    if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== 'YOUR_DISCORD_BOT_TOKEN_HERE') {
      config.token = process.env.DISCORD_TOKEN;
    }
  } catch (err) {
    console.error('[Config] Could not parse config.json:', err);
  }
}

console.log(`
╔══════════════════════════════════════════════════════════════╗
║               ⚡  SONIONBOT DISCORD ENGINE  ⚡                ║
║           Zero Dependencies • 100% Native Node.js            ║
╚══════════════════════════════════════════════════════════════╝
`);

if (!config.token || config.token === 'YOUR_DISCORD_BOT_TOKEN_HERE') {
  console.warn(`
⚠️  ACTION REQUIRED:
1. Open config.json (or .env) and paste your Discord Bot Token.
2. Ensure "MESSAGE CONTENT INTENT" is enabled in Discord Developer Portal!
3. Run: node index.js
`);
}

// Initialize database
const db = new Database('./database.json');

// Initialize REST and Gateway
const rest = new DiscordRestClient(config.token);
const gateway = new DiscordGatewayClient(config.token);

gateway.on('ready', (botUser) => {
  console.log(`🚀 [Ready] Bot is online as ${botUser.username}#${botUser.discriminator || '0'}!`);
  console.log(`📌 [Prefix] Current command prefix is "${config.prefix}"`);
  console.log(`✨ Moderation, RPG Gathering, Casino & Economy systems active.`);
});

gateway.on('messageCreate', async (message) => {
  await handleMessage({ message, rest, db, config });
});

gateway.on('interactionCreate', async (interaction) => {
  await handleInteraction({ interaction, rest, db, config });
});

// Graceful shutdown handling
function handleExit() {
  console.log('\n[Shutdown] Saving database and closing connections...');
  db.saveImmediately();
  gateway.disconnect();
  process.exit(0);
}

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);

// Connect if token is set
if (config.token && config.token !== 'YOUR_DISCORD_BOT_TOKEN_HERE') {
  gateway.connect();
}
