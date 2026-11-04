// Age trophies: a small placeable trophy cup, awarded by each age's final quest.
// All share one model (assets/kubejs/models/block/trophy.json); each age has its own
// metal texture (drawn by tools/scripts/make_textures.py).

const TROPHIES = [
  { id: 'stone_age_trophy', name: 'Stone Age Trophy', sound: 'stone', rarity: 'uncommon' },
  { id: 'bronze_age_trophy', name: 'Bronze Age Trophy', sound: 'metal', rarity: 'uncommon' },
  { id: 'ritual_age_trophy', name: 'Ritual Age Trophy', sound: 'amethyst', rarity: 'rare' },
  { id: 'twilight_trophy', name: 'Twilight Trophy', sound: 'metal', rarity: 'rare' },
  { id: 'steam_age_trophy', name: 'Steam Age Trophy', sound: 'metal', rarity: 'rare' },
  { id: 'industrial_age_trophy', name: 'Industrial Age Trophy', sound: 'metal', rarity: 'epic' },
  { id: 'atomic_age_trophy', name: 'Atomic Age Trophy', sound: 'metal', rarity: 'epic', light: 0.6 },
  { id: 'space_age_trophy', name: 'Space Age Trophy', sound: 'metal', rarity: 'epic', light: 0.4 },
  // Space Exploration: one per planet dungeon boss.
  { id: 'moon_trophy', name: 'Moon Trophy', sound: 'metal', rarity: 'rare' },
  { id: 'mars_trophy', name: 'Mars Trophy', sound: 'metal', rarity: 'rare' },
  { id: 'venus_trophy', name: 'Venus Trophy', sound: 'metal', rarity: 'rare' },
  { id: 'mercury_trophy', name: 'Mercury Trophy', sound: 'metal', rarity: 'rare' },
  { id: 'glacio_trophy', name: 'Glacio Trophy', sound: 'metal', rarity: 'rare' },
  // Side paths.
  { id: 'chef_trophy', name: "Chef's Trophy", sound: 'metal', rarity: 'uncommon' },
  { id: 'legend_trophy', name: 'Legend Trophy', sound: 'metal', rarity: 'epic', light: 0.5 },
  { id: 'explorer_trophy', name: "Explorer's Trophy", sound: 'metal', rarity: 'rare' },
  { id: 'archmage_trophy', name: 'Archmage Trophy', sound: 'amethyst', rarity: 'epic', light: 0.4 },
  { id: 'engineer_trophy', name: "Engineer's Trophy", sound: 'metal', rarity: 'rare' },
  { id: 'machinist_trophy', name: "Machinist's Trophy", sound: 'metal', rarity: 'rare' }
]

StartupEvents.registry('block', event => {
  TROPHIES.forEach(t => {
    event.create(t.id)
      .displayName(t.name)
      .soundType(t.sound)
      .hardness(0.5)
      .lightLevel(t.light || 0)
      .resistance(6)
      .defaultCutout()
      .box(4, 0, 4, 12, 13, 12) // hitbox around the cup
      .modelGenerator(m => {
        m.parent('kubejs:block/trophy')
        m.textures({ all: `kubejs:block/${t.id}` })
      })
      .item(item => item.maxStackSize(1).rarity(t.rarity))
  })
})
