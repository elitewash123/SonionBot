// ==========================================================
// Rich Embed Builder & Formatter (Zero Dependencies)
// ==========================================================

export const COLORS = {
  PRIMARY: 0x5865F2,    // Discord Blurple
  SUCCESS: 0x2ECC71,    // Emerald Green
  WARNING: 0xF1C40F,    // Gold / Warning
  ERROR: 0xE74C3C,      // Coral Red
  INFO: 0x00D2D3,       // Cyan / Info
  PURPLE: 0x9B59B6,     // Amethyst Purple
  DARK: 0x2B2D31,       // Dark Theme Background
  GOLD: 0xFFD700        // Casino Gold
};

/**
 * Creates an ASCII progress bar
 * @param {number} current Current value
 * @param {number} max Maximum value
 * @param {number} size Bar character length
 * @returns {string} e.g. [██████░░░░] 60%
 */
export function createProgressBar(current, max, size = 10) {
  if (max <= 0) max = 1;
  const progress = Math.min(Math.max(current / max, 0), 1);
  const filledLength = Math.round(size * progress);
  const emptyLength = size - filledLength;
  const bar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
  const percentage = Math.round(progress * 100);
  return `\`[${bar}]\` ${percentage}%`;
}

/**
 * Formats a number with commas (e.g. 1,000,000)
 * @param {number} num 
 * @returns {string}
 */
export function formatNumber(num) {
  return Math.floor(num).toLocaleString('en-US');
}

/**
 * Formats seconds into human-readable countdown string (e.g. "1h 24m 10s")
 * @param {number} seconds 
 * @returns {string}
 */
export function formatTime(seconds) {
  const s = Math.ceil(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const remS = s % 60;
  if (m < 60) return `${m}m ${remS}s`;
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return `${h}h ${remM}m ${remS}s`;
}

/**
 * Helper to build a standard Discord Embed object
 */
export function createEmbed({
  title,
  description,
  color = COLORS.PRIMARY,
  fields = [],
  thumbnail = null,
  image = null,
  footer = null,
  author = null,
  timestamp = false
}) {
  const embed = {
    title,
    description,
    color,
    fields: fields.filter(f => f && f.name && f.value)
  };

  if (thumbnail) embed.thumbnail = { url: thumbnail };
  if (image) embed.image = { url: image };
  if (footer) {
    embed.footer = typeof footer === 'string' ? { text: footer } : footer;
  }
  if (author) {
    embed.author = typeof author === 'string' ? { name: author } : author;
  }
  if (timestamp) {
    embed.timestamp = new Date().toISOString();
  }

  return embed;
}

export function errorEmbed(title, description) {
  return createEmbed({
    title: `❌  ${title}`,
    description,
    color: COLORS.ERROR
  });
}

export function successEmbed(title, description) {
  return createEmbed({
    title: `✅  ${title}`,
    description,
    color: COLORS.SUCCESS
  });
}

export function infoEmbed(title, description) {
  return createEmbed({
    title: `ℹ️  ${title}`,
    description,
    color: COLORS.INFO
  });
}
