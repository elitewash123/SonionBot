// ==========================================================
// Items, Tools, Rarities & Loot Tables (Zero Dependencies)
// ==========================================================

export const RARITIES = {
  COMMON: { name: 'Common', color: 0x95a5a6, symbol: '⚪', multiplier: 1.0 },
  UNCOMMON: { name: 'Uncommon', color: 0x2ecc71, symbol: '🟢', multiplier: 1.5 },
  RARE: { name: 'Rare', color: 0x3498db, symbol: '🔵', multiplier: 2.5 },
  EPIC: { name: 'Epic', color: 0x9b59b6, symbol: '🟣', multiplier: 4.0 },
  LEGENDARY: { name: 'Legendary', color: 0xf1c40f, symbol: '🟡', multiplier: 8.0 },
  MYTHICAL: { name: 'Mythical', color: 0xe74c3c, symbol: '🔴', multiplier: 15.0 }
};

export const TOOLS = {
  // Fishing Rods
  rod_wood: { id: 'rod_wood', name: 'Wooden Rod', type: 'rod', tier: 1, cost: 0, power: 1.0, luck: 0.05, desc: 'A basic makeshift wooden fishing rod.' },
  rod_fiber: { id: 'rod_fiber', name: 'Fiberglass Rod', type: 'rod', tier: 2, cost: 500, power: 1.3, luck: 0.15, desc: 'Sturdy rod that reaches deeper waters.' },
  rod_titan: { id: 'rod_titan', name: 'Titanium Rod', type: 'rod', tier: 3, cost: 2500, power: 1.8, luck: 0.28, desc: 'High-tech rod forged with titanium alloy.' },
  rod_gold: { id: 'rod_gold', name: 'Golden Rod', type: 'rod', tier: 4, cost: 10000, power: 2.5, luck: 0.45, desc: 'Enchanted golden rod blessed by the sea gods.' },
  rod_cosmic: { id: 'rod_cosmic', name: 'Cosmic Harpoon Rod', type: 'rod', tier: 5, cost: 40000, power: 4.0, luck: 0.70, desc: 'Celestial rod capable of hooking cosmic sea beasts.' },

  // Pickaxes
  pick_stone: { id: 'pick_stone', name: 'Stone Pickaxe', type: 'pickaxe', tier: 1, cost: 0, power: 1.0, luck: 0.05, desc: 'Rough stone pickaxe.' },
  pick_iron: { id: 'pick_iron', name: 'Iron Pickaxe', type: 'pickaxe', tier: 2, cost: 500, power: 1.3, luck: 0.15, desc: 'Sharp iron pickaxe capable of cracking hard ore.' },
  pick_diamond: { id: 'pick_diamond', name: 'Diamond Pickaxe', type: 'pickaxe', tier: 3, cost: 2500, power: 1.8, luck: 0.28, desc: 'Gleaming diamond pickaxe with superior durability.' },
  pick_nether: { id: 'pick_nether', name: 'Netherite Pickaxe', type: 'pickaxe', tier: 4, cost: 10000, power: 2.5, luck: 0.45, desc: 'Forged in subterranean magma for heavy extraction.' },
  pick_void: { id: 'pick_void', name: 'Void Drill Pickaxe', type: 'pickaxe', tier: 5, cost: 40000, power: 4.0, luck: 0.70, desc: 'Annihilates bedrock and extracts rare singularities.' },

  // Shovels
  shovel_plastic: { id: 'shovel_plastic', name: 'Plastic Shovel', type: 'shovel', tier: 1, cost: 0, power: 1.0, luck: 0.05, desc: 'A child\'s toy shovel, but it gets dirt moving.' },
  shovel_steel: { id: 'shovel_steel', name: 'Steel Spade', type: 'shovel', tier: 2, cost: 500, power: 1.3, luck: 0.15, desc: 'Heavy duty steel shovel for deeper excavations.' },
  shovel_alloy: { id: 'shovel_alloy', name: 'Alloy Trench Shovel', type: 'shovel', tier: 3, cost: 2500, power: 1.8, luck: 0.28, desc: 'Reinforced alloy shovel designed for archaeological digs.' },
  shovel_drill: { id: 'shovel_drill', name: 'Pneumatic Excavator', type: 'shovel', tier: 4, cost: 10000, power: 2.5, luck: 0.45, desc: 'High pressure pneumatic spade for quick excavation.' },
  shovel_quantum: { id: 'shovel_quantum', name: 'Quantum Excavator', type: 'shovel', tier: 5, cost: 40000, power: 4.0, luck: 0.70, desc: 'Displaces subterranean matter across dimensions.' },

  // Hunting Weapons
  hunt_sling: { id: 'hunt_sling', name: 'Wooden Slingshot', type: 'weapon', tier: 1, cost: 0, power: 1.0, luck: 0.05, desc: 'A pocket slingshot for hunting small critters.' },
  hunt_bow: { id: 'hunt_bow', name: 'Recurve Bow', type: 'weapon', tier: 2, cost: 500, power: 1.3, luck: 0.15, desc: 'Flexible recurve hunting bow.' },
  hunt_crossbow: { id: 'hunt_crossbow', name: 'Heavy Crossbow', type: 'weapon', tier: 3, cost: 2500, power: 1.8, luck: 0.28, desc: 'High-torque crossbow with deadly precision.' },
  hunt_sniper: { id: 'hunt_sniper', name: 'Hunting Rifle .308', type: 'weapon', tier: 4, cost: 10000, power: 2.5, luck: 0.45, desc: 'Scoped high-caliber rifle for dangerous apex predators.' },
  hunt_laser: { id: 'hunt_laser', name: 'Plasma Arc Cannon', type: 'weapon', tier: 5, cost: 40000, power: 4.0, luck: 0.70, desc: 'Vaporizes mythical beasts and locks onto targets.' }
};

export const BANK_UPGRADES = {
  vault_bronze: { id: 'vault_bronze', name: 'Bronze Vault Box', price: 2500, capacityAdd: 10000, desc: 'Expands bank max capacity by +10,000 coins.' },
  vault_silver: { id: 'vault_silver', name: 'Silver Bank Vault', price: 10000, capacityAdd: 50000, desc: 'Expands bank max capacity by +50,000 coins.' },
  vault_gold: { id: 'vault_gold', name: 'Gold Reinforced Vault', price: 40000, capacityAdd: 250000, desc: 'Expands bank max capacity by +250,000 coins.' },
  vault_platinum: { id: 'vault_platinum', name: 'Platinum Fortress Vault', price: 150000, capacityAdd: 1000000, desc: 'Expands bank max capacity by +1,000,000 coins.' },
  vault_infinite: { id: 'vault_infinite', name: 'Dimensional Quantum Vault', price: 500000, capacityAdd: 10000000, desc: 'Expands bank max capacity by +10,000,000 coins.' }
};

export const CONSUMABLES = {
  lucky_clover: { id: 'lucky_clover', name: 'Four-Leaf Clover', price: 150, type: 'buff', duration: 10, bonusLuck: 0.25, desc: '+25% Luck for 10 gathering actions.' },
  energy_drink: { id: 'energy_drink', name: 'Energy Elixir', price: 200, type: 'buff', duration: 15, cooldownReduction: 0.40, desc: 'Reduces gathering cooldowns by 40% for 15 uses.' },
  golden_bait: { id: 'golden_bait', name: 'Golden Bait', price: 300, type: 'buff', duration: 5, fishBonus: 0.50, desc: 'Guarantees rare or higher catch on next 5 fishing tries.' }
};

export const FISH_LOOT = [
  { id: 'fish_seaweed', name: 'Soggy Seaweed', emoji: '🌿', rarity: 'COMMON', value: 8, xp: 5 },
  { id: 'fish_boot', name: 'Old Leather Boot', emoji: '👢', rarity: 'COMMON', value: 12, xp: 5 },
  { id: 'fish_minnow', name: 'Silver Minnow', emoji: '🐟', rarity: 'COMMON', value: 25, xp: 10 },
  { id: 'fish_carp', name: 'Pond Carp', emoji: '🐠', rarity: 'COMMON', value: 35, xp: 12 },
  { id: 'fish_bass', name: 'Largemouth Bass', emoji: '🐟', rarity: 'UNCOMMON', value: 60, xp: 20 },
  { id: 'fish_salmon', name: 'Atlantic Salmon', emoji: '🍣', rarity: 'UNCOMMON', value: 85, xp: 25 },
  { id: 'fish_squid', name: 'Giant Squid Tentacle', emoji: '🦑', rarity: 'UNCOMMON', value: 110, xp: 30 },
  { id: 'fish_clownfish', name: 'Neon Clownfish', emoji: '🐡', rarity: 'RARE', value: 180, xp: 45 },
  { id: 'fish_electric_eel', name: 'Electric Eel', emoji: '⚡', rarity: 'RARE', value: 240, xp: 55 },
  { id: 'fish_swordfish', name: 'Royal Swordfish', emoji: '🗡️', rarity: 'EPIC', value: 500, xp: 90 },
  { id: 'fish_shark', name: 'Great White Shark', emoji: '🦈', rarity: 'EPIC', value: 750, xp: 120 },
  { id: 'fish_whale', name: 'Bioluminescent Whale', emoji: '🐋', rarity: 'LEGENDARY', value: 1600, xp: 220 },
  { id: 'fish_kraken', name: 'Kraken\'s Eye', emoji: '🐙', rarity: 'LEGENDARY', value: 2400, xp: 300 },
  { id: 'fish_leviathan', name: 'Abyssal Leviathan', emoji: '🐉', rarity: 'MYTHICAL', value: 6500, xp: 600 },
  { id: 'fish_poseidon', name: 'Trident of Atlantis', emoji: '🔱', rarity: 'MYTHICAL', value: 12000, xp: 1000 }
];

export const MINE_LOOT = [
  { id: 'mine_cobble', name: 'Cobblestone Slab', emoji: '🪨', rarity: 'COMMON', value: 10, xp: 5 },
  { id: 'mine_gravel', name: 'Flint & Gravel', emoji: '🧱', rarity: 'COMMON', value: 18, xp: 6 },
  { id: 'mine_coal', name: 'Lump of Coal', emoji: '⚫', rarity: 'COMMON', value: 35, xp: 10 },
  { id: 'mine_copper', name: 'Copper Ingot', emoji: '🟧', rarity: 'UNCOMMON', value: 65, xp: 18 },
  { id: 'mine_iron', name: 'Refined Iron Ore', emoji: '⛓️', rarity: 'UNCOMMON', value: 100, xp: 25 },
  { id: 'mine_silver', name: 'Silver Ore', emoji: '🪙', rarity: 'RARE', value: 190, xp: 40 },
  { id: 'mine_gold', name: 'Pure Gold Nugget', emoji: '🏆', rarity: 'RARE', value: 270, xp: 55 },
  { id: 'mine_amethyst', name: 'Amethyst Shard', emoji: '🔮', rarity: 'EPIC', value: 480, xp: 85 },
  { id: 'mine_diamond', name: 'Flawless Diamond', emoji: '💎', rarity: 'EPIC', value: 800, xp: 130 },
  { id: 'mine_emerald', name: 'Deepslate Emerald', emoji: '❇️', rarity: 'EPIC', value: 1100, xp: 160 },
  { id: 'mine_meteorite', name: 'Glowing Meteorite', emoji: '☄️', rarity: 'LEGENDARY', value: 2500, xp: 320 },
  { id: 'mine_voidstone', name: 'Dark Void Crystal', emoji: '🌌', rarity: 'LEGENDARY', value: 3800, xp: 450 },
  { id: 'mine_ancient_core', name: 'Core of the Earth', emoji: '🌋', rarity: 'MYTHICAL', value: 8500, xp: 750 },
  { id: 'mine_infinity_gem', name: 'Prismatic Infinity Gem', emoji: '💠', rarity: 'MYTHICAL', value: 15000, xp: 1200 }
];

export const DIG_LOOT = [
  { id: 'dig_dirt', name: 'Clump of Mud', emoji: '💩', rarity: 'COMMON', value: 5, xp: 4 },
  { id: 'dig_worm', name: 'Earthworm', emoji: '🪱', rarity: 'COMMON', value: 15, xp: 8 },
  { id: 'dig_bottle', name: 'Rusty Soda Can', emoji: '🥫', rarity: 'COMMON', value: 25, xp: 10 },
  { id: 'dig_bone', name: 'Animal Bone', emoji: '🦴', rarity: 'UNCOMMON', value: 55, xp: 16 },
  { id: 'dig_coin', name: 'Old Victorian Coin', emoji: '🪙', rarity: 'UNCOMMON', value: 90, xp: 22 },
  { id: 'dig_arrowhead', name: 'Flint Arrowhead', emoji: '🏹', rarity: 'RARE', value: 175, xp: 42 },
  { id: 'dig_fossil', name: 'Trilobite Fossil', emoji: '🐚', rarity: 'RARE', value: 260, xp: 55 },
  { id: 'dig_amphora', name: 'Ancient Greek Amphora', emoji: '🏺', rarity: 'EPIC', value: 520, xp: 95 },
  { id: 'dig_geode', name: 'Crystalline Geode', emoji: '🔮', rarity: 'EPIC', value: 850, xp: 140 },
  { id: 'dig_pirate_chest', name: 'Buried Pirate Chest', emoji: '🏴‍☠️', rarity: 'LEGENDARY', value: 2600, xp: 340 },
  { id: 'dig_t_rex', name: 'Complete T-Rex Skull', emoji: '🦖', rarity: 'LEGENDARY', value: 4200, xp: 480 },
  { id: 'dig_pharaoh_mask', name: 'Golden Pharaoh Deathmask', emoji: '👑', rarity: 'MYTHICAL', value: 9000, xp: 800 },
  { id: 'dig_alien_artifact', name: 'Extraterrestrial Relic', emoji: '🛸', rarity: 'MYTHICAL', value: 16000, xp: 1300 }
];

export const HUNT_LOOT = [
  { id: 'hunt_feather', name: 'Crow Feather', emoji: '🪶', rarity: 'COMMON', value: 10, xp: 5 },
  { id: 'hunt_rabbit', name: 'Wild Hare', emoji: '🐇', rarity: 'COMMON', value: 30, xp: 10 },
  { id: 'hunt_turkey', name: 'Wild Turkey', emoji: '🦃', rarity: 'COMMON', value: 45, xp: 12 },
  { id: 'hunt_fox', name: 'Red Fox Pelt', emoji: '🦊', rarity: 'UNCOMMON', value: 85, xp: 24 },
  { id: 'hunt_deer', name: 'Majestic Stag Antlers', emoji: '🦌', rarity: 'UNCOMMON', value: 130, xp: 32 },
  { id: 'hunt_boar', name: 'Tusked Wild Boar', emoji: '🐗', rarity: 'RARE', value: 220, xp: 50 },
  { id: 'hunt_wolf', name: 'Alpha Timberwolf Pelt', emoji: '🐺', rarity: 'RARE', value: 310, xp: 65 },
  { id: 'hunt_grizzly', name: 'Grizzly Bear Claw', emoji: '🐻', rarity: 'EPIC', value: 600, xp: 110 },
  { id: 'hunt_panther', name: 'Shadow Panther Fangs', emoji: '🐆', rarity: 'EPIC', value: 950, xp: 150 },
  { id: 'hunt_mammoth', name: 'Woolly Mammoth Tusk', emoji: '🦣', rarity: 'LEGENDARY', value: 2800, xp: 350 },
  { id: 'hunt_hydra', name: 'Venomous Hydra Scale', emoji: '🐍', rarity: 'LEGENDARY', value: 4500, xp: 500 },
  { id: 'hunt_phoenix', name: 'Rebirth Phoenix Feather', emoji: '🪽', rarity: 'MYTHICAL', value: 9500, xp: 850 },
  { id: 'hunt_dragon', name: 'Ancient Crimson Dragon Heart', emoji: '🐲', rarity: 'MYTHICAL', value: 18000, xp: 1500 }
];

// Lookup table
export const ALL_ITEMS = {};
[...FISH_LOOT, ...MINE_LOOT, ...DIG_LOOT, ...HUNT_LOOT].forEach(item => {
  ALL_ITEMS[item.id] = item;
});
