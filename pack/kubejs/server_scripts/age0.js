// Age 0: Stone Age.
// No crafting table, so everything is made in the 2x2 inventory grid. No smelting.
// Gate to Age 1: crafting the crafting table itself.
// (The age itself is opened by the age's gate quest in the quest book, once every main
// quest of the age is done: SevTech style. See tools/scripts/gen_quests.py GATES.)
//
// Chain (0.4.1, RLCraft-style): dig gravel -> flint (no gravel-on-stone knapping since 0.4.41, owner);
//        knap flint on stone -> flint shards; 2 shards -> flint blade;
//        blade + stick -> flint knife;
//        grass cut with the knife -> plant fibre -> plant string;
//        leaves/saplings -> sticks; shard + string + stick -> flint hatchet;
//        hatchet chops logs; logs split on a chopping block -> planks (no planks in the
//        inventory grid until Age 1); lashed frame + flint blade + planks -> crafting table.

const AGE_1 = 'age_1'
const $PaHand = Java.loadClass('net.minecraft.world.InteractionHand')
const $PaTag = Java.loadClass('net.minecraft.nbt.CompoundTag')

ServerEvents.recipes(event => {
  // Plank recipes for every wood type (modded woods included) move to the "paplanks"
  // namespace, which AStages locks until Age 1 (stages/mod_gates.js). From Age 1 one log
  // makes two planks; in the Stone Age planks only come from the chopping block.
  const plankRecipes = []
  event.forEachRecipe({ type: 'minecraft:crafting_shapeless', output: '#minecraft:planks' }, recipe => {
    const ingredients = recipe.getOriginalRecipeIngredients()
    const result = recipe.getOriginalRecipeResult()
    if (ingredients.size() === 1 && result.count > 1) {
      plankRecipes.push({ id: recipe.getId(), item: result.id, ingredient: ingredients.get(0) })
    }
  })
  plankRecipes.forEach((p, n) => {
    event.remove({ id: p.id })
    event.shapeless(Item.of(p.item, 2), [p.ingredient]).id(`paplanks:${p.item.replace(':', '/')}_${n}`)
  })

  // Flint tools are made from knapped shards.
  event.shaped('kubejs:flint_knife', ['B', 'S'], {
    B: 'kubejs:flint_blade',
    S: 'minecraft:stick'
  }).id('kubejs:age0/flint_knife')
  event.shaped('kubejs:flint_blade', ['F', 'F'], {
    F: 'kubejs:flint_shard'
  }).id('kubejs:age0/flint_blade')
  event.shaped('kubejs:lashed_frame', ['ST', 'TS'], {
    S: 'minecraft:stick',
    T: 'kubejs:plant_string'
  }).id('kubejs:age0/lashed_frame')
  // Two logs and a hatchet stroke make the chopping block.
  event.shapeless('kubejs:chopping_block', ['2x #minecraft:logs', 'kubejs:flint_hatchet'])
    .damageIngredient('kubejs:flint_hatchet', 3)
    .id('kubejs:age0/chopping_block')
  // The crafting table needs everything the Stone Age teaches.
  event.remove({ output: 'minecraft:crafting_table' })
  event.shaped('minecraft:crafting_table', ['PP', 'FB'], {
    P: '#minecraft:planks',
    F: 'kubejs:lashed_frame',
    B: 'kubejs:flint_blade'
  }).id('kubejs:age0/crafting_table')
  // After the first one, more tables come from four planks (the "patable" namespace is
  // locked behind the first_table stage, stages/mod_gates.js).
  event.shaped('minecraft:crafting_table', ['PP', 'PP'], {
    P: '#minecraft:planks'
  }).id('patable:crafting_table')


  event.shapeless('kubejs:plant_string', ['3x kubejs:plant_fibre']).id('kubejs:age0/plant_string')

  event.shaped('kubejs:flint_hatchet', [
    'FT',
    ' S'
  ], {
    F: 'kubejs:flint_shard',
    T: 'kubejs:plant_string',
    S: 'minecraft:stick'
  }).id('kubejs:age0/flint_hatchet')

  // The fire pit: a campfire made in the 2x2 grid. Cooks food and boils water.
  event.shaped('minecraft:campfire', [
    'SS',
    'FL'
  ], {
    S: 'minecraft:stick',
    F: 'minecraft:flint',
    L: '#minecraft:logs'
  }).id('kubejs:age0/fire_pit')

  // Tough As Nails only purifies water in a copper-and-glass purifier, which Age 0
  // cannot build. A leather canteen and the fire pit make boiling water possible.
  event.shapeless('toughasnails:empty_leather_canteen', [
    '2x minecraft:leather',
    'kubejs:plant_string'
  ]).id('kubejs:age0/leather_canteen')
  // River water fills it as plain "water", swamps as "dirty water": both boil clean.
  event.campfireCooking('toughasnails:leather_purified_water_canteen', 'toughasnails:leather_dirty_water_canteen')
    .id('kubejs:age0/boil_canteen')
  event.campfireCooking('toughasnails:leather_purified_water_canteen', 'toughasnails:leather_water_canteen')
    .id('kubejs:age0/boil_canteen_river')
})

LootJS.modifiers(event => {
  // Plant fibre: only from grass and ferns cut with the flint knife (that's what the knife
  // is for). Leaves give sticks, not fibre.
  event.addBlockModifier(['minecraft:short_grass', 'minecraft:tall_grass', 'minecraft:fern', 'minecraft:large_fern'])
    .matchMainHand('kubejs:flint_knife')
    .randomChance(0.6)
    .addLoot('kubejs:plant_fibre')

  // Sticks without an axe: leaves broken by a player, and saplings.
  event.addBlockModifier('#minecraft:leaves')
    .matchPlayerCustom(player => true)
    .randomChance(0.2)
    .addLoot('minecraft:stick')
  event.addBlockModifier('#minecraft:saplings')
    .randomChance(0.5)
    .addLoot('minecraft:stick')

  // Gravel gives flint more often than vanilla.
  event.addBlockModifier('minecraft:gravel')
    .randomChance(0.2)
    .addLoot('minecraft:flint')
})

// Knapping flint: right-click stone holding flint to strike off shards. Often it shatters.
BlockEvents.rightClicked(event => {
  const { player, block, item } = event
  if (String(event.hand) !== 'MAIN_HAND' || item.id !== 'minecraft:flint') return
  if (!block.hasTag('minecraft:base_stone_overworld') && block.id !== 'minecraft:cobblestone') return
  if (!player.isCreative()) item.shrink(1)
  if (Math.random() < 0.6) {
    player.give('2x kubejs:flint_shard')
    player.setStatusMessage(Text.gray('You strike two sharp shards off the flint.'))
  } else {
    player.setStatusMessage(Text.gray('The flint shatters into useless chips.'))
  }
  event.server.runCommandSilent(`playsound minecraft:block.stone.hit block @a ${block.x} ${block.y} ${block.z} 1 1.5`)
  player.swing()
  event.cancel()
})

// Cutting grass wears the flint knife (instant-break blocks never damage a tool otherwise,
// so its durability bar would never move).
// (No id filter: KubeJS ignores a list of ids there.)
const PA_GRASSES = ['minecraft:short_grass', 'minecraft:tall_grass', 'minecraft:fern', 'minecraft:large_fern']
BlockEvents.broken(event => {
  const player = event.player
  if (player && !player.isCreative() && player.mainHandItem.id == 'kubejs:flint_knife' &&
      PA_GRASSES.indexOf(String(event.block.id)) >= 0) {
    player.damageHeldItem($PaHand.MAIN_HAND, 1)
  }
})

// The chopping block (loading logs, chopping, planks) is all in
// startup_scripts/chopping_block.js: it has to run in the player's game too.

// Logs need an axe. Punching trees is not how this world works.
// startup_scripts/age0_logs.js stops logs from cracking at all without one; this
// shows the hint when you start hitting, and is a backstop if a break slips through.
function needsAxe(player, block) {
  return player && !player.isCreative() && block.hasTag('minecraft:logs') && !player.mainHandItem.hasTag('minecraft:axes')
}

BlockEvents.leftClicked(event => {
  if (needsAxe(event.player, event.block)) {
    event.player.setStatusMessage(Text.red('You need a hatchet to chop wood.'))
  }
})

BlockEvents.broken(event => {
  if (needsAxe(event.player, event.block)) event.cancel()
})

// Crafting tables found in villages: a Stone Age player can't use one (only their own
// counts, and it opens Age I), and breaking one only salvages a couple of planks.
// Tables players placed themselves are remembered and always work.
// (Visual Workbench swaps tables for its own blocks, so match on the id's ending.)
function paIsCraftingTable(block) {
  return String(block.id).endsWith('crafting_table')
}

function paTableKey(block) {
  return `${block.level.dimension}|${block.x},${block.y},${block.z}`
}

function paPlacedTables(server) {
  const pd = server.persistentData
  if (!pd.contains('pa_placed_tables')) pd.put('pa_placed_tables', new $PaTag())
  return pd.getCompound('pa_placed_tables')
}

function paVillageTable(player, block) {
  return player && !player.isCreative() && !AStages.playerHasStage(player, AGE_1) && paIsCraftingTable(block) &&
    !paPlacedTables(player.server).contains(paTableKey(block))
}

BlockEvents.placed(event => {
  if (event.player && paIsCraftingTable(event.block)) paPlacedTables(event.server).putBoolean(paTableKey(event.block), true)
})

// Clicking a table remembers which one; if a crafting screen then opens from a village
// table, it closes again. (The screen is closed rather than the click cancelled: other
// mods handle table clicks too, so a cancelled click can't be relied on.)
BlockEvents.rightClicked(event => {
  const player = event.player
  if (!player || !paIsCraftingTable(event.block)) return
  player.persistentData.putLong('pa_table_click', player.server.getTickCount())
  player.persistentData.putBoolean('pa_table_village', paVillageTable(player, event.block))
})

PlayerEvents.inventoryOpened(event => {
  const player = event.player
  const pd = player.persistentData
  if (!pd.getBoolean('pa_table_village') || player.server.getTickCount() - pd.getLong('pa_table_click') > 2) return
  if (String(event.inventoryContainer).indexOf('Crafting') < 0) return
  pd.putBoolean('pa_table_village', false)
  player.closeMenu()
  player.setStatusMessage(Text.red("You don't know how to use this yet. Craft your own crafting table."))
})

BlockEvents.broken(event => {
  const { player, block } = event
  if (!paVillageTable(player, block)) return
  block.set('minecraft:air')
  player.give(Item.of('minecraft:oak_planks', 2))
  event.cancel() // last: cancel() ends the handler
})

// Players already past the Stone Age (from before the four-plank recipe) get it too.
PlayerEvents.loggedIn(event => {
  const player = event.player
  if (AStages.playerHasStage(player, AGE_1) && !AStages.playerHasStage(player, 'first_table')) {
    AStages.addStageToPlayer(player, 'first_table', false, false, false)
  }
})

// (After the check above, so it still sees the table as placed.)
BlockEvents.broken(event => {
  if (paIsCraftingTable(event.block)) paPlacedTables(event.server).remove(paTableKey(event.block))
})

// The gate: crafting your own crafting table unlocks Age 1.
ItemEvents.crafted('minecraft:crafting_table', event => {
  // The first one also unlocks the four-plank recipe.
  if (!AStages.playerHasStage(event.player, 'first_table')) AStages.addStageToPlayer(event.player, 'first_table', true, false, false)
  if (AStages.playerHasStage(event.player, AGE_1)) return
  event.player.tell(Text.gold('A crafting table! Age I opens once every Stone Age quest is done (check the quest book).'))
})
