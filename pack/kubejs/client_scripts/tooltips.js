// Hints for mechanics that are not obvious from recipes alone.

ItemEvents.modifyTooltips(event => {
  // Stone Age
  event.add('kubejs:chopping_block', [Text.gray('Hold left-click on it with your hatchet:'), Text.gray('the logs you carry split into planks, two each.'), Text.gray('Break it by hand to move it.')])
  event.add('kubejs:flint_knife', Text.gray('Cut grass with it for plant fibre.'))
  // Trophies
  event.add('kubejs:stone_age_trophy', Text.gold('Awarded for completing the Stone Age.'))
  event.add('kubejs:bronze_age_trophy', Text.gold('Awarded for completing Age I: Bronze.'))
  event.add('kubejs:ritual_age_trophy', Text.gold('Awarded for completing Age II: Medieval and Ritual.'))
  event.add('kubejs:twilight_trophy', Text.gold('Awarded for completing Age III: The Twilight.'))
  event.add('kubejs:steam_age_trophy', Text.gold('Awarded for completing Age IV: Steam.'))
  event.add('kubejs:industrial_age_trophy', Text.gold('Awarded for completing Age V: Industry.'))
  event.add('kubejs:atomic_age_trophy', Text.gold('Awarded for completing Age VI: Advanced Tech.'))
  event.add('kubejs:space_age_trophy', Text.gold('Awarded for forging the Heart of the Ages. Every age complete.'))
  event.add('kubejs:moon_trophy', Text.gold('Awarded for defeating the Super Lunarian.'))
  event.add('kubejs:mars_trophy', Text.gold('Awarded for defeating the Super Raptor.'))
  event.add('kubejs:venus_trophy', Text.gold('Awarded for defeating the Super Evokers.'))
  event.add('kubejs:mercury_trophy', Text.gold('Awarded for defeating the Super Mogler.'))
  event.add('kubejs:glacio_trophy', Text.gold('Awarded for defeating the Super Golem.'))
  event.add('kubejs:chef_trophy', Text.gold('Awarded for serving a feast.'))
  event.add('kubejs:legend_trophy', Text.gold('Awarded for defeating every boss in the pack.'))
  event.add('kubejs:explorer_trophy', Text.gold('Awarded for finding every kind of structure.'))
  event.add('kubejs:archmage_trophy', Text.gold('Awarded for walking every path of magic.'))
  event.add('kubejs:engineer_trophy', Text.gold('Awarded for mastering Create.'))
  event.add('kubejs:machinist_trophy', Text.gold('Awarded for a base that runs itself.'))
  // Age 7
  ;[['lunar', 'Super Lunarian', 'Moon'], ['martian', 'Super Raptor', 'Mars'], ['venusian', 'Super Evokers', 'Venus'],
    ['mercurian', 'Super Mogler', 'Mercury'], ['glacian', 'Super Golem', 'Glacio']].forEach(t => {
    event.add(`kubejs:${t[0]}_sigil`, Text.gray(`Dropped by the ${t[1]} on ${t[2]}. Forge it into the ${t[2]} core.`))
    event.add(`kubejs:${t[0]}_core`, Text.gold('One of the five cores of the Heart of the Ages.'))
  })
  event.add('kubejs:emblem_of_the_ages', Text.gold('A piece of every age you have lived through.'))
  event.add('kubejs:heart_of_the_ages', Text.gold('Forged from every world and every age. You finished Project Ages.'))
  event.add('kubejs:heart_of_the_ages', Text.lightPurple('Carried: flight, Regeneration, Fire Resistance, Night Vision.'))
  event.add('kubejs:heart_of_the_ages', Text.gray('Bound to its owner; it always returns. Crafts every creative item.'))
  event.add('ad_astra:desh_ingot', Text.gray('From the Moon. QIO storage and ultimate upgrades need it.'))
  event.add('ad_astra:ostrum_plate', Text.gray('From Mars. The MekaSuit and Meka-Tool need it.'))
  event.add('ad_astra:calorite_plate', Text.gray('From Venus. The fusion reactor and SPS need it.'))
  // Northstar (0.4.41): build-your-own rockets, landing on Ad Astra's planets (kubejs/data/northstar).
  event.add('northstar:rocket_station', Text.gray("Build your own rocket with Create. It flies to Ad Astra's planets."))
  event.add('northstar:rocket_station', Text.gray('Wear an Ad Astra space suit when you land.'))
  event.add('northstar:lunar_sapphire_shard', Text.gray('Crush moon deepslate to get it.'))
  event.add('kubejs:heart_of_the_ages', Text.gray('Sneak + right-click: powers on/off.'))
  // Where each Ad Astra suit keeps you alive (planet temperatures: data/ad_astra/planets), on every
  // piece: a set only protects when all four match (owner test: plain boots under a netherite suit
  // burned on Mercury).
  const SUIT_PIECES = ['helmet', 'suit', 'pants', 'boots']
  SUIT_PIECES.forEach(p => event.add(`ad_astra:space_${p}`, Text.gray('Cold only. All 4 pieces must match.')))
  SUIT_PIECES.forEach(p => event.add(`ad_astra:netherite_space_${p}`, Text.gray('Heat-proof if all 4 are netherite.')))
  SUIT_PIECES.forEach(p => event.add(p === 'suit' ? 'ad_astra:jet_suit' : `ad_astra:jet_suit_${p}`, Text.gray('Heat-proof if all 4 are jet suit.')))
  // Age 6
  event.add('mekanism:pellet_plutonium', Text.gray('Only fission waste makes plutonium. Four of these open Age VII; the NASA Workbench needs one.'))
  // Age 5
  event.add('immersiveengineering:capacitor_hv', Text.gray('Keeps its charge when picked up. Two full ones open Age VI; the Metallurgic Infuser needs one.'))
  // Age 4
  event.add('create:precision_mechanism', Text.gray("Make 16 (with a steam engine running) to open Age V. The Engineer's Hammer needs one."))
  // Age 3
  event.add('kubejs:steam_core', Text.gray('Crafting it opens Age IV: Steam. Keep it: every Steam Engine is built around it (it stays in the grid).'))
  event.add('twilightforest:exanimate_essence', Text.gray('Dropped by the Lich. One goes into a Steam Core.'))
  // Age 2
  event.add('kubejs:twilight_key', Text.gray('Throw into a portal pool to light the way to the Twilight Forest.'))
  event.add('kubejs:twilight_key', Text.gray('Made on the Enchanting Apparatus (Ars) or the Astral Resonating table at night.'))
  event.add('ars_nouveau:magebloom_crop', Text.gray('Drops from archwood leaves. Grows slowly.'))
  // Age 1
  event.add('minecraft:blast_furnace', Text.gray('Smelts ores, bronze blend, and burns logs into charcoal.'))
  event.add('minecraft:furnace', Text.gray('Cooks food and glass. Metal needs the Bloomery.'))
  event.add('kubejs:bronze_blend', Text.gray('Smelt in the Bloomery for bronze.'))
  // Age 0
  event.add('kubejs:plant_fibre', Text.gray('Break grass or leaves by hand to gather.'))
  event.add('kubejs:flint_hatchet', Text.gray('Chops logs. Fragile: carry spare flint.'))
  event.add('minecraft:gravel', Text.gray('Dig it by hand: sometimes it gives flint.'))
  event.add('minecraft:campfire', Text.gray('Fire pit: cooks food and boils a dirty canteen.'))
  event.add('toughasnails:empty_leather_canteen', Text.gray('Fill at water, then boil it on a campfire.'))
})
