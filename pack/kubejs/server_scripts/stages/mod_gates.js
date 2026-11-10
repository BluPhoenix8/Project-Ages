// priority: 900
// Turns the progression plan (startup_scripts/01_progression.js) into AStages locks.

// Every item lock goes through paItemLock. AStages only puts a lock on its "can't carry" and
// "can't wear" lists once the lock is changed after it's made (otherwise locked items just
// show as "Unfamiliar Item" and stay in your hands), so each one is changed here: locked
// items may stay in chests (opening loot doesn't throw them on the ground), and that change
// puts the lock on the lists. server_scripts/stages/unfamiliar_items.js is a backstop.
// Locked blocks can always be broken (a Stone Age player couldn't mine framed planks in a
// structure, owner 0.4.41); what they drop still can't be picked up.
function paItemLock(restriction) {
  restriction.allowContainerStorage()
  restriction.allowMining()
  restriction.setChanged()
  return restriction
}

const earlyIds = []
Object.keys(global.EARLY_ITEMS).forEach(stage => {
  global.EARLY_ITEMS[stage].forEach(id => {
    earlyIds.push(id)
    paItemLock(AStages.addRestrictionForItem(`gate/${stage}/item/${id.replace(':', '/')}`, stage, id))
  })
})

Object.keys(global.LATE_ITEMS).forEach(stage => {
  global.LATE_ITEMS[stage].forEach(id => {
    paItemLock(AStages.addRestrictionForItem(`gate/${stage}/late/${id.replace(':', '/')}`, stage, id))
  })
})

// Seeds can be picked up and planted at any age (owner and Ensykrov, 2026-11-08: "whenever you break grass and
// stuff, you should be able to pick up seeds"). What they grow stays locked to its mod's age: a harvest from too
// early can't be picked up and stays on the ground. Every item named *_seeds, *_seed, seed(s) or rice / rice_grains (planted as they are; owner, tests 10 and 11), except Mystical
// Agriculture's resource seeds (they are that mod's Age V progression).
const paSeedIds = []
Java.loadClass('net.minecraft.core.registries.BuiltInRegistries').ITEM.keySet().forEach(rl => {
  const id = String(rl)
  if (/^((.*_)?seeds?|rice|rice_grains)$/.test(id.substring(id.indexOf(':') + 1)) && id.indexOf('mysticalag') != 0) paSeedIds.push(id)
})

var paSeedsFreed = 0
Object.keys(global.MOD_GATES).forEach(stage => {
  global.MOD_GATES[stage].forEach(mod => {
    const restriction = AStages.addRestrictionForMod(`gate/${stage}/mod/${mod}`, stage, mod)
    earlyIds.filter(id => id.startsWith(`${mod}:`)).forEach(id => restriction.ignoreItems(id))
    paSeedIds.filter(id => id.startsWith(`${mod}:`)).forEach(id => { restriction.ignoreItems(id); paSeedsFreed++ })
    paItemLock(restriction)
  })
})
console.info(`Seeds open at every age: ${paSeedsFreed} (of ${paSeedIds.length} seed items)`)

// Hidden ores (SevTech style, 0.6.1, owner: "SevTech does it perfectly"): until its age, an ore looks
// like the rock it sits in and mines as that rock, so a Bronze Age player never sees iron.
// The list is generated (startup_scripts/04_hidden_ores.js, tools/scripts/gen_hidden_ores.py).
var paHiddenOres = 0
global.HIDDEN_ORES.forEach(o => {
  try {
    var ore = Block.getBlock(o[0]), rock = Block.getBlock(o[2])
    if (String(Block.getId(ore)) != o[0] || String(Block.getId(rock)) != o[2]) return  // a mod that's gone
    AStages.addRestrictionForOre(`gate/${o[1]}/ore/${o[0].replace(':', '/')}`, o[1], ore.defaultBlockState(), rock.defaultBlockState())
      .matchAllBlockStates()
      .affectPlayerActions()
      .setChanged()
    paHiddenOres++
  } catch (err) { console.error(`Hidden ore ${o[0]}: ${err}`) }
})
console.info(`Hidden ores: ${paHiddenOres} of ${global.HIDDEN_ORES.length}`)

// Dimensions that must wait for their age even if a portal gets built early.
AStages.addRestrictionForDimension('gate/age_3/dim/aether', 'age_3', 'aether:the_aether')
AStages.addRestrictionForDimension('gate/age_6/dim/otherside', 'age_6', 'deeperdarker:otherside')
// The Twilight Forest portal is handled by the Age 2 Twilight Key (scripted with Age 2).

// Crafting grids and furnaces found in villages stay closed until the player earns them.
AStages.addRestrictionForScreen('gate/age_1/screen/crafting', 'age_1', 'minecraft:crafting')
// Planks: only the chopping block makes them in the Stone Age (server_scripts/age0.js puts
// every plank recipe in the "paplanks" namespace).
AStages.addRestrictionForModRecipe('gate/age_1/recipe/planks', 'age_1', 'paplanks')
// More crafting tables from four planks, once you've made your first (server_scripts/age0.js).
AStages.addRestrictionForModRecipe('gate/first_table/recipe/table', 'first_table', 'patable')
// More Mechanical Presses without a Steam Core, once you've made your first (age_links.js).
AStages.addRestrictionForModRecipe('gate/first_press/recipe/press', 'first_press', 'papress')
AStages.addRestrictionForScreen('gate/age_1/screen/furnace', 'age_1', 'minecraft:furnace')
AStages.addRestrictionForScreen('gate/age_1/screen/smoker', 'age_1', 'minecraft:smoker')
AStages.addRestrictionForScreen('gate/age_1/screen/blast_furnace', 'age_1', 'minecraft:blast_furnace')

// Titles shown when a player enters a new age, or reaches an unlock inside one.
Object.keys(global.SUB_STAGES).forEach(age => {
  global.SUB_STAGES[age].forEach(sub => {
    AStages.customizeStage(sub.stage, sub.title)
      .titleOnAdd(s => Text.aqua(sub.title))
      .subTitleOnAdd(s => Text.gray(sub.subtitle))
  })
})

global.AGES.forEach(age => {
  AStages.customizeStage(age.stage, age.title)
    .titleOnAdd(s => Text.gold(age.title))
    .subTitleOnAdd(s => Text.gray(age.subtitle))
})
