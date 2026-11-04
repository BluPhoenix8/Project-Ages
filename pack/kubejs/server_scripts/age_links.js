// Each age's final item has a job in the next age. (Ages 0-2 already work this way:
// the crafting table, bronze tools and the Twilight Key.)
//   Age 3 Steam Core          -> the first Mechanical Press is built around it (kept in the grid:
//                                the finale's Emblem needs it too); more presses come from
//                                Create's own recipe after that (stage first_press)
//   Age 4 Precision Mechanism -> the Engineer's Hammer, Immersive Engineering's first tool
//   Age 5 HV Capacitor        -> the Metallurgic Infuser, Mekanism's first machine
//   Age 6 Plutonium Pellet    -> the NASA Workbench, where every rocket is built

ServerEvents.recipes(event => {
  // Create's press recipe moves to the "papress" namespace, locked behind first_press
  // (stages/mod_gates.js); the first press needs the Steam Core as well, and hands it back.
  event.remove({ id: 'create:crafting/kinetics/mechanical_press' })
  event.shaped('create:mechanical_press', ['S ', 'CK', 'I '], {
    S: 'create:shaft',
    C: 'create:andesite_casing',
    I: '#c:storage_blocks/iron',
    K: 'kubejs:steam_core'
  }).keepIngredient('kubejs:steam_core').id('kubejs:links/mechanical_press_first')
  event.shaped('create:mechanical_press', ['S', 'C', 'I'], {
    S: 'create:shaft',
    C: 'create:andesite_casing',
    I: '#c:storage_blocks/iron'
  }).id('papress:mechanical_press')

  event.remove({ id: 'immersiveengineering:crafting/hammer' })
  event.shaped('immersiveengineering:hammer', ['ifM', 'si ', 's  '], {
    i: '#c:ingots/iron',
    f: '#c:strings',
    s: '#c:rods/wooden',
    M: 'create:precision_mechanism'
  }).id('kubejs:links/engineers_hammer')

  event.remove({ id: 'mekanism:metallurgic_infuser' })
  event.shaped('mekanism:metallurgic_infuser', ['I#I', 'ROR', 'ICI'], {
    '#': 'minecraft:furnace',
    I: '#c:ingots/iron',
    O: '#c:ingots/osmium',
    R: '#c:dusts/redstone',
    C: 'immersiveengineering:capacitor_hv'
  }).id('kubejs:links/metallurgic_infuser')

  event.remove({ id: 'ad_astra:nasa_workbench' })
  event.shaped('ad_astra:nasa_workbench', ['RPR', 'TCT', 'PUP'], {
    R: 'ad_astra:iron_rod',
    P: 'ad_astra:steel_plate',
    T: 'minecraft:redstone_torch',
    C: 'minecraft:crafting_table',
    U: 'mekanism:pellet_plutonium'
  }).id('kubejs:links/nasa_workbench')
})

// Crafting the first Mechanical Press unlocks Create's own recipe for more.
ItemEvents.crafted('create:mechanical_press', event => {
  if (!AStages.playerHasStage(event.player, 'first_press')) AStages.addStageToPlayer(event.player, 'first_press', true, false, false)
})

// Players already past Age 4 (from before the press needed the Steam Core) get it too.
PlayerEvents.loggedIn(event => {
  const player = event.player
  if (AStages.playerHasStage(player, 'age_5') && !AStages.playerHasStage(player, 'first_press')) {
    AStages.addStageToPlayer(player, 'first_press', false, false, false)
  }
})
