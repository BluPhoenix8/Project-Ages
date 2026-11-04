// Age 2: Medieval & Ritual.
// Where the pack stops being survival and starts being modded: Ars Nouveau.
//
// Chain: gold + lapis + book -> spell book; archwood leaves -> magebloom seed;
//        magebloom -> fibre; fibre + sourcestone + gold + diamond -> Enchanting Apparatus;
//        Source Jar + sourcelink -> source; lapis/amethyst -> source gem (imbuement);
//        source gem + magebloom fibre + bronze on the Apparatus -> Twilight Key.
// Astral Sorcery is the other path: the key is also made on Astral's Resonating table at night
// (resonating gem + starmetal + bronze + rock crystal + liquid starlight). Either path opens Age 3.
// Gate to Age 3: throw the Twilight Key into a portal pool (the only thing that lights
// the Twilight Forest portal) and step through. Entering the Twilight Forest opens Age 3.

const AGE_3 = 'age_3'
const TWILIGHT_FOREST = 'twilightforest:twilight_forest'

ServerEvents.recipes(event => {
  // Astral path: the Twilight Key on Astral Sorcery's Resonating (second-tier) table, at night.
  // Needs starmetal (transmuted iron ore) and a resonating gem (Starlight Infuser), so the
  // Astral road is at least as long as the Ars one.
  event.custom({
    type: 'astralsorcery:altar_crafting',
    base_focus_shatter_chance: 0.0,
    duration: 300,
    effects: ['astralsorcery:default_central_beam', 'astralsorcery:default_altar_sparkle',
      'astralsorcery:default_lumen_input', 'astralsorcery:default_relay_input'],
    grid: {
      key: {
        S: { type: 'item', ingredient: { item: 'astralsorcery:starmetal_ingot' } },
        B: { type: 'item', ingredient: { tag: 'c:ingots/bronze' } },
        G: { type: 'item', ingredient: { item: 'astralsorcery:resonating_gem' } },
        C: { type: 'item', ingredient: { item: 'astralsorcery:rock_crystal' } },
        L: { type: 'fluid', ingredient: { amount: 1000, ingredient: { fluid: 'astralsorcery:liquid_starlight' } } }
      },
      pattern: ['SBS', 'BGB', 'CLC'],
      relay_pattern: ['     ', '     ', '     ', '     ', '     ']
    },
    may_chain: false,
    only_night: true,
    output_modifiers: [],
    outputs: [{ count: 1, id: 'kubejs:twilight_key' }],
    required_additional_inputs: [],
    required_fluid: [],
    required_lumen: [],
    required_starlight: [],
    required_type: 'resonance'
  }).id('kubejs:age2/twilight_key_astral')

  // The spell book asks for gold and lapis, so the age starts with a mining push.
  event.remove({ id: 'ars_nouveau:novice_spell_book' })
  event.shaped('ars_nouveau:novice_spell_book', [
    'GLG',
    'LBL',
    'GLG'
  ], {
    G: '#c:ingots/gold',
    L: '#c:gems/lapis',
    B: 'minecraft:book'
  }).id('kubejs:age2/novice_spell_book')

  // The Enchanting Apparatus is built from magebloom.
  event.remove({ id: 'ars_nouveau:enchanting_apparatus' })
  event.shaped('ars_nouveau:enchanting_apparatus', [
    'FSF',
    'GDG',
    'FSF'
  ], {
    F: 'ars_nouveau:magebloom_fiber',
    S: 'ars_nouveau:sourcestone',
    G: '#c:ingots/gold',
    D: '#c:gems/diamond'
  }).id('kubejs:age2/enchanting_apparatus')

  // The Twilight Key: magebloom fibre, bronze and a source gem, on the Apparatus.
  event.custom({
    type: 'ars_nouveau:enchanting_apparatus',
    keepNbtOfReagent: false,
    reagent: { item: 'ars_nouveau:source_gem' },
    pedestalItems: [
      { item: 'ars_nouveau:magebloom_fiber' },
      { item: 'ars_nouveau:magebloom_fiber' },
      { item: 'ars_nouveau:magebloom_fiber' },
      { tag: 'c:ingots/bronze' },
      { tag: 'c:ingots/bronze' },
      { tag: 'c:ingots/bronze' }
    ],
    result: { count: 1, id: 'kubejs:twilight_key' },
    sourceCost: 2000
  }).id('kubejs:age2/twilight_key')
})

// Only the Twilight Key lights the portal (Twilight Forest normally uses a diamond).
ServerEvents.tags('item', event => {
  event.removeAll('twilightforest:portal/activator')
  event.add('twilightforest:portal/activator', 'kubejs:twilight_key')
})

// Magebloom doesn't generate on its own; its seeds are found in Ars Nouveau's
// archwood forests. (The Apparatus can also grow more seeds from source gems later.)
LootJS.modifiers(event => {
  event.addBlockModifier([
    'ars_nouveau:blue_archwood_leaves',
    'ars_nouveau:red_archwood_leaves',
    'ars_nouveau:purple_archwood_leaves',
    'ars_nouveau:green_archwood_leaves'
  ])
    .matchPlayerCustom(player => true)
    .randomChance(0.06)
    .addLoot('ars_nouveau:magebloom_crop')
})

// The gate quest ("Into the Twilight") opens Age 3 when you step into the Twilight Forest
// with every Age II quest done. Arriving early: remind the player every 30 seconds.
PlayerEvents.tick(event => {
  const player = event.player
  if (player.tickCount % 600 !== 0) return
  if (String(player.level.dimension) !== TWILIGHT_FOREST) return
  if (AStages.playerHasStage(player, AGE_3)) return
  player.setStatusMessage(Text.gold('Age III opens once every Age II quest is done. Check the quest book.'))
})
