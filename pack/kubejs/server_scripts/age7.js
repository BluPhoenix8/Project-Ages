// Age 7: Space.
// Ad Astra carries the structure: rocket + launch pad, a space suit with oxygen, then the
// Moon, Mars, Venus, Mercury and Glacio, each further rocket tier made from the last
// planet's metal.
//
// Off-world resources feed late Mekanism, so the planets are functional, not scenic. Only
// endgame items that Age 6 never needs (ultimate circuits run Age 6's ore processing):
//   Moon desh: QIO drive base, ultimate tier installer
//   Mars ostrum: MekaSuit and Meka-Tool
//   Venus calorite: fusion reactor frame, SPS casing
//
// Finishing condition: a self-sustaining base off-world. Placing all of BASE_PARTS on
// the same planet gives the player the `space_base` stage, which completes the final quest.

const PLANETS = {
  'ad_astra:moon': 'the Moon',
  'ad_astra:mars': 'Mars',
  'ad_astra:venus': 'Venus',
  'ad_astra:mercury': 'Mercury',
  'ad_astra:glacio': 'Glacio'
}

// What a base needs to keep you alive: [key, description, test on the placed block].
const BASE_PARTS = [
  ['oxygen', 'an Oxygen Distributor', block => block.id == 'ad_astra:oxygen_distributor'],
  ['power', 'a Solar Panel', block => block.id == 'ad_astra:solar_panel'],
  ['water', 'a Water Pump', block => block.id == 'ad_astra:water_pump'],
  ['bed', 'a bed', block => block.hasTag('minecraft:beds')],
  ['food', 'a planted crop', block => block.hasTag('minecraft:crops')]
]
const SPACE_BASE_STAGE = 'space_base'

// Space Exploration chapter: each planet's dungeon boss (Ad Astra: More Structures) and an
// orbital space station. Bosses are named mobs; everyone near the kill gets the stage.
const SPACE_BOSSES = {
  'Super Lunarian': 'space_boss_moon',
  'Super Raptor': 'space_boss_mars',
  'Super Evoker': 'space_boss_venus',
  'Super Mogler': 'space_boss_mercury',
  'Super Golem': 'space_boss_glacio'
}
const SPACE_STATION_STAGE = 'space_station'
// Everything this file can give a player, so `/pa age` can start them over.
const SPACE_STAGES = [SPACE_BASE_STAGE, SPACE_STATION_STAGE].concat(Object.keys(SPACE_BOSSES).map(k => SPACE_BOSSES[k]))

ServerEvents.recipes(event => {
  // Mars: the MekaSuit and Meka-Tool are plated in ostrum instead of HDPE.
  ;['mekanism:mekasuit_helmet', 'mekanism:mekasuit_bodyarmor', 'mekanism:mekasuit_pants',
    'mekanism:mekasuit_boots', 'mekanism:meka_tool'].forEach(id => {
    event.replaceInput({ output: id }, 'mekanism:hdpe_sheet', 'ad_astra:ostrum_plate')
  })
  // Moon: QIO storage and the ultimate tier installer need desh.
  event.replaceInput({ output: 'mekanism:qio_drive_base' }, 'mekanism:ingot_lead', 'ad_astra:desh_ingot')
  event.remove({ id: 'mekanism:tier_installer/ultimate' })
  event.shaped('mekanism:ultimate_tier_installer', [
    'ACA',
    'IPI',
    'ACA'
  ], {
    A: '#mekanism:alloys/atomic',
    C: '#c:circuits/ultimate',
    I: '#c:gems/diamond',
    P: 'ad_astra:desh_plate'
  }).id('kubejs:age7/ultimate_tier_installer')
  // Venus: the fusion reactor frame and the SPS casing (below) need calorite.
  event.replaceInput({ output: 'mekanismgenerators:fusion_reactor_frame' }, 'mekanism:steel_casing', 'ad_astra:calorite_plate')

  event.remove({ id: 'mekanism:sps_casing' })
  event.shaped('mekanism:sps_casing', [
    'PAP',
    'A#A',
    'PAP'
  ], {
    P: 'ad_astra:calorite_plate',
    A: '#c:pellets/polonium',
    '#': '#c:pellets/plutonium'
  }).id('kubejs:age7/sps_casing')
})

EntityEvents.death(event => {
  const entity = event.entity
  const name = entity.customName
  const stage = name ? SPACE_BOSSES[String(name.getString())] : null
  if (!stage) return
  const dim = String(entity.level.dimension)
  // Everyone in the fight gets the planet's sigil (every kill, so a lost sigil can be
  // won again); the boss stage only counts once.
  const finale = global.PLANET_FINALE.find(f => f.boss == String(name.getString()))
  event.server.players.forEach(p => {
    if (String(p.level.dimension) != dim || p.distanceTo(entity) > 48) return
    if (finale) {
      p.give(Item.of(`kubejs:${finale.sigil}`))
      p.tell(Text.lightPurple(`You claimed the ${finale.sigilName}.`))
    }
    if (p.stages.has(stage)) return
    p.stages.add(stage)
    p.tell(Text.gold(`${name.getString()} defeated!`))
  })
})

// The finale: five planet cores and the Emblem of the Ages make the Heart of the Ages.
ServerEvents.recipes(event => {
  const CORE_MATERIALS = {
    // planet: [corners, edges]: things you can only get on (or for) that world.
    moon: ['ad_astra:desh_block', 'ad_astra:cheese_block'],
    mars: ['ad_astra:ostrum_block', 'ad_astra:mars_stone'],
    venus: ['ad_astra:calorite_block', 'ad_astra:infernal_spire_block'],
    mercury: ['mekanism:ultimate_control_circuit', 'ad_astra:polished_mercury_stone'],
    glacio: ['ad_astra:ice_shard', 'ad_astra:glacian_log']
  }
  global.PLANET_FINALE.forEach(f => {
    const m = CORE_MATERIALS[f.planet]
    event.shaped(`kubejs:${f.core}`, ['CEC', 'ESE', 'CEC'], {
      C: m[0], E: m[1], S: `kubejs:${f.sigil}`
    }).id(`kubejs:age7/${f.core}`)
  })
  // One piece of every age, around a nether star.
  event.shaped('kubejs:emblem_of_the_ages', ['TBK', 'SNP', 'CUE'], {
    T: 'minecraft:crafting_table',          // Age 0: the first table
    B: 'mekanism:block_bronze',             // Age 1: bronze
    K: 'kubejs:twilight_key',               // Age 2: the key to the Twilight
    S: 'kubejs:steam_core',                 // Age 3: the Steam Core
    P: 'create:precision_mechanism',        // Age 4: precision
    C: 'immersiveengineering:capacitor_hv', // Age 5: sustained power
    U: 'mekanism:pellet_plutonium',         // Age 6: the reactor's fuel
    E: 'ad_astra:space_helmet',             // Age 7: the space age
    N: 'minecraft:nether_star'
  }).id('kubejs:age7/emblem_of_the_ages')
  event.shaped('kubejs:heart_of_the_ages', ['LRM', 'XEX', 'VAG'], {
    L: 'kubejs:lunar_core',
    R: 'kubejs:mercurian_core',
    M: 'kubejs:martian_core',
    V: 'kubejs:venusian_core',
    G: 'kubejs:glacian_core',
    E: 'kubejs:emblem_of_the_ages',
    A: 'mekanism:pellet_antimatter',
    X: 'mekanism:ultimate_control_circuit'
  }).id('kubejs:age7/heart_of_the_ages')
})

// Forging the Heart is announced to the whole server.
ItemEvents.crafted('kubejs:heart_of_the_ages', event => {
  const player = event.player
  if (!player || player.persistentData.getBoolean('pa_heart_forged')) return
  player.persistentData.putBoolean('pa_heart_forged', true)
  event.server.tell(Text.gold(`${player.username} has forged the Heart of the Ages and completed Project Ages!`).bold())
  event.server.runCommandSilent(`title ${player.username} title {"text":"Heart of the Ages","color":"gold","bold":true}`)
  event.server.runCommandSilent(`title ${player.username} subtitle {"text":"Every age, every world. You did it.","color":"yellow"}`)
  event.server.runCommandSilent(`execute at ${player.username} run playsound minecraft:ui.toast.challenge_complete master @a ~ ~ ~ 1 1`)
})

BlockEvents.placed(event => {
  const player = event.player
  if (!player) return
  const dim = String(event.level.dimension)
  // A launch pad placed in orbit means the player built a space station there.
  if (dim.endsWith('_orbit') && event.block.id == 'ad_astra:launch_pad' && !player.stages.has(SPACE_STATION_STAGE)) {
    player.stages.add(SPACE_STATION_STAGE)
    player.tell(Text.gold('Your space station is open for business.'))
    return
  }
  const planet = PLANETS[dim]
  if (!planet || player.stages.has(SPACE_BASE_STAGE)) return
  const part = BASE_PARTS.find(p => p[2](event.block))
  if (!part) return

  const data = player.persistentData
  const key = `project_ages_space_base/${dim}`
  const done = String(data.getString(key)).split(',').filter(s => s)
  if (done.indexOf(part[0]) >= 0) return
  done.push(part[0])
  data.putString(key, done.join(','))

  const missing = BASE_PARTS.filter(p => done.indexOf(p[0]) < 0).map(p => p[1])
  if (missing.length) {
    player.tell(Text.aqua(`Base on ${planet}: ${done.length}/${BASE_PARTS.length}. Still needs ${missing.join(', ')}.`))
    return
  }
  player.stages.add(SPACE_BASE_STAGE)
  event.server.runCommandSilent(`title ${player.username} times 10 100 30`)
  event.server.runCommandSilent(`title ${player.username} subtitle {"text":"A home among the stars","color":"gray"}`)
  event.server.runCommandSilent(`title ${player.username} title {"text":"${global.PACK.name} complete","color":"gold"}`)
  player.tell(Text.gold(`Your base on ${planet} keeps you alive. You've finished every age. Thank you for playing!`))
})
