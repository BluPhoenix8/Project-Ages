// Age 7 (Space) finale items. Recipes, boss drops and the finale itself live in
// server_scripts/age7.js.
//
// Each planet's boss drops a sigil. Sigil + that planet's materials make a planet core.
// Five cores + the Emblem of the Ages (one piece of every earlier age) make the Heart of
// the Ages: crafting it completes the pack.

global.PLANET_FINALE = [
  { planet: 'moon', boss: 'Super Lunarian', sigil: 'lunar_sigil', sigilName: 'Lunar Sigil', core: 'lunar_core', coreName: 'Lunar Core' },
  { planet: 'mars', boss: 'Super Raptor', sigil: 'martian_sigil', sigilName: 'Martian Sigil', core: 'martian_core', coreName: 'Martian Core' },
  { planet: 'venus', boss: 'Super Evoker', sigil: 'venusian_sigil', sigilName: 'Venusian Sigil', core: 'venusian_core', coreName: 'Venusian Core' },
  { planet: 'mercury', boss: 'Super Mogler', sigil: 'mercurian_sigil', sigilName: 'Mercurian Sigil', core: 'mercurian_core', coreName: 'Mercurian Core' },
  { planet: 'glacio', boss: 'Super Golem', sigil: 'glacian_sigil', sigilName: 'Glacian Sigil', core: 'glacian_core', coreName: 'Glacian Core' }
]

// Tooltips are in client_scripts/tooltips.js.
StartupEvents.registry('item', event => {
  const GLINT = 'minecraft:enchantment_glint_override'
  global.PLANET_FINALE.forEach(p => {
    event.create(p.sigil).displayName(p.sigilName).maxStackSize(16).rarity('rare')
    event.create(p.core).displayName(p.coreName).maxStackSize(1).rarity('epic').component(GLINT, true)
  })
  event.create('emblem_of_the_ages').displayName('Emblem of the Ages').maxStackSize(1).rarity('epic')
    .component(GLINT, true)
  event.create('heart_of_the_ages').displayName('Heart of the Ages').maxStackSize(1).rarity('epic')
    .component(GLINT, true).fireResistant(true)
})
