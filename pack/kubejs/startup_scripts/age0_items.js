// Age 0 (Stone Age) items. Recipes and drops live in server_scripts/age0.js.

// Flint tier: wooden-level mining, slow, and fragile.
// Durability is the main tuning dial for Age 0. 20 uses (0.4.1, tougher tools, RLCraft
// feel): several hatchets and knives before the crafting table. 10 is miserable.
ItemEvents.toolTierRegistry(event => {
  event.add('flint', tier => {
    tier.uses = 20
    tier.speed = 2.0
    tier.attackDamageBonus = 0.5
    tier.incorrectBlocksForDropsTag = 'minecraft:incorrect_for_wooden_tool'
    tier.enchantmentValue = 5
    tier.repairIngredient = 'minecraft:flint'
  })
  // The knife's own tier: the flint tier but 64 uses (0.4.8). Each grass cut wears it by one
  // (server_scripts/age0.js), so at 20 it broke every few handfuls of fibre.
  event.add('flint_knife', tier => {
    tier.uses = 64
    tier.speed = 2.0
    tier.attackDamageBonus = 0.5
    tier.incorrectBlocksForDropsTag = 'minecraft:incorrect_for_wooden_tool'
    tier.enchantmentValue = 5
    tier.repairIngredient = 'minecraft:flint'
  })
})

// Woods the chopping block can show; anything else uses 'other' (oak look).
global.PA_CHOP_WOODS = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'crimson', 'warped', 'other']

StartupEvents.registry('item', event => {
  event.create('plant_fibre').displayName('Plant Fibre')
  event.create('plant_string').displayName('Plant String')
  // RLCraft-style start: knap flint on stone into shards, which make every flint tool.
  event.create('flint_shard').displayName('Flint Shard')
  event.create('flint_blade').displayName('Flint Blade')
  event.create('lashed_frame').displayName('Lashed Frame')
  // The knife cuts grass for plant fibre (grass gives none by hand).
  event.create('flint_knife', 'sword')
    .displayName('Flint Knife')
    .tier('flint_knife')
    .tag('c:tools/knife')

  event.create('flint_hatchet', 'axe')
    .displayName('Flint Hatchet')
    .tier('flint')
    .tag('minecraft:axes')
})

StartupEvents.registry('block', event => {
  // A low stump (like the Lumberjacking mod's): right-click it with a log to set the log
  // on it, then chop it with a hatchet for planks (server_scripts/age0.js).
  // Holding a log swaps in a "loaded" block that shows that wood; modded logs show as oak.
  event.create('chopping_block')
    .displayName('Chopping Block')
    .soundType('wood')
    .hardness(1.5)
    .box(0, 0, 0, 16, 8, 16)
    .modelGenerator(m => m.parent('kubejs:block/pa_chopping_block')) // assets/.../pa_chopping_block.json
    .tagBlock('minecraft:mineable/axe')
  global.PA_CHOP_WOODS.forEach(wood => {
    event.create(`chopping_block_${wood}`)
      .displayName('Chopping Block')
      .noItem()
      .soundType('wood')
      .hardness(4) // about three seconds with a flint hatchet
      .box(0, 0, 0, 16, 8, 16)
      .box(1, 8, 1, 15, 16, 15)
      .modelGenerator(m => m.parent(`kubejs:block/pa_chopping_block_${wood}`))
      .tagBlock('minecraft:mineable/axe')
  })
})
