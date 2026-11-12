// Age 1: Bronze.
// You have a crafting table, but metal is not a given: you build the infrastructure.
//
// Chain: clay + stone -> Bloomery (the vanilla blast furnace, renamed);
//        logs -> charcoal in the Bloomery (coal stays locked until Age 2);
//        ores -> ingots only in the Bloomery (the ordinary furnace cooks food and glass until Age 2);
//        copper + tin -> bronze blend -> bronze ingot in the Bloomery;
//        bronze -> Silent Gear tools.
// (The age itself is opened by the age's gate quest in the quest book, once every main
// quest of the age is done: SevTech style. See tools/scripts/gen_quests.py GATES.)
// Gate to Age 2: craft all five Silent Gear tools (pickaxe, axe, shovel, hoe, sword)
// with bronze heads.

const AGE_2 = 'age_2'
const $PaBloomeryLocks = Java.loadClass('com.alessandro.astages.api.util.ARestrictionUtils')
const $PaBloomeryType = Java.loadClass('net.minecraft.world.item.crafting.RecipeType')
const $PaBloomeryList = Java.loadClass('java.util.ArrayList')
const $PaBloomeryId = Java.loadClass('net.minecraft.resources.ResourceLocation')

ServerEvents.recipes(event => {
  // The Bloomery: one expensive block, built once.
  event.remove({ id: 'minecraft:blast_furnace' })
  event.shaped('minecraft:blast_furnace', [
    'CSC',
    'S S',
    'CSC'
  ], {
    C: 'minecraft:clay',
    S: '#c:cobblestones'
  }).id('kubejs:age1/bloomery')

  // Metal comes from the Bloomery. For every furnace recipe that makes an ingot, make sure the Bloomery has the same
  // recipe, then lock the furnace version until Age II: AStages stops a furnace on it while the furnace's owner (the
  // player who placed it, or first opened it) is online and before Age II, and JEI's furnace page hides it until
  // then. The recipes stay because machines, colonies and auto-smelting tools read furnace recipes: 0.7.0 removed
  // them, so Mekanism's Energized Smelter took no dusts (MrFseregaF), MineColonies' Smelter made no ingots and the
  // Fiery Pickaxe dropped raw metal (owner, 0.7.1: "Metal from Age II").
  const bloomeryHas = {}
  event.forEachRecipe({ type: 'minecraft:blasting' }, recipe => {
    const ingredients = recipe.getOriginalRecipeIngredients()
    const result = recipe.getOriginalRecipeResult()
    if (ingredients.size() === 0 || result.isEmpty()) return
    ingredients.get(0).getStackArray().forEach(stack => { bloomeryHas[`${stack.id}>${result.id}`] = true })
  })
  const furnaceMetal = []
  event.forEachRecipe({ type: 'minecraft:smelting', output: '#c:ingots' }, recipe => {
    const ingredients = recipe.getOriginalRecipeIngredients()
    const result = recipe.getOriginalRecipeResult()
    if (ingredients.size() === 0 || result.isEmpty()) return
    let covered = true
    ingredients.get(0).getStackArray().forEach(stack => {
      if (!bloomeryHas[`${stack.id}>${result.id}`]) covered = false
    })
    furnaceMetal.push({ id: recipe.getId(), ingredient: ingredients.get(0), result: result.id, count: result.count, covered: covered })
  })
  const furnaceLocked = new $PaBloomeryList()
  furnaceMetal.forEach(m => {
    furnaceLocked.add($PaBloomeryId.parse(String(m.id)))
    if (!m.covered) {
      event.blasting(Item.of(m.result, m.count), m.ingredient).id(`kubejs:age1/bloomery_from/${m.id.replace(':', '/')}`)
    }
  })
  $PaBloomeryLocks.addRestrictionForRecipe('gate/age_2/furnace_metal', AGE_2, $PaBloomeryType.SMELTING, furnaceLocked)
  console.info(`Bloomery: ${furnaceLocked.size()} furnace recipes for metal wait for Age II in the ordinary furnace`)

  // Charcoal: burn logs in the Bloomery.
  event.blasting('minecraft:charcoal', '#minecraft:logs_that_burn').xp(0.1).id('kubejs:age1/charcoal')

  // Bronze: one copper and one tin make two bronze blend; the Bloomery turns blend into bronze.
  event.shapeless('2x kubejs:bronze_blend', ['#c:ingots/copper', '#c:ingots/tin']).id('kubejs:age1/bronze_blend')
  event.blasting('mekanism:ingot_bronze', 'kubejs:bronze_blend').xp(0.3).id('kubejs:age1/bronze_ingot')
})

// ---------------------------------------------------------------- the gate

const $GearData = Java.loadClass('net.silentchaos512.gear.util.GearData')
const BRONZE_TOOLS = {
  'silentgear:pickaxe': 'pickaxe',
  'silentgear:axe': 'axe',
  'silentgear:shovel': 'shovel',
  'silentgear:hoe': 'hoe',
  'silentgear:sword': 'sword'
}
const BRONZE_MATERIAL = 'silentgear:bronze'

function headMaterial(stack) {
  // Declared outside the try: Rhino throws "redeclaration" for a const inside try,
  // which the catch would turn into "not bronze".
  let part, material
  try {
    part = $GearData.getCoatingOrMainPart(stack)
    material = part ? part.getPrimaryMaterial() : null
  } catch (e) {
    console.error(`Bronze check failed to read ${stack.id}: ${e}`)
    return ''
  }
  return material ? String(material.getId()) : ''
}

ItemEvents.crafted(event => {
  const tool = BRONZE_TOOLS[String(event.item.id)]
  if (!tool) return
  const player = event.player
  if (headMaterial(event.item) !== BRONZE_MATERIAL) {
    if (!AStages.playerHasStage(player, AGE_2)) player.setStatusMessage(Text.gray('Only tools with a bronze head count toward the Bronze Age.'))
    return
  }

  // The quest book's "Bronze <tool>" quests check this stage (FTB Quests stage task), so
  // only a bronze head completes them.
  player.stages.add(`bronze_${tool}`)
  if (AStages.playerHasStage(player, AGE_2)) return

  const data = player.persistentData
  data.putBoolean(`project_ages_bronze_${tool}`, true)
  const made = Object.keys(BRONZE_TOOLS).map(k => BRONZE_TOOLS[k]).filter(t => data.getBoolean(`project_ages_bronze_${t}`))
  if (made.length < Object.keys(BRONZE_TOOLS).length) {
    player.tell(Text.gold(`Bronze ${tool} forged (${made.length}/5).`))
    return
  }
  // All five: the gate quest checks this stage (it opens Age 2 once the age's quests are done).
  player.stages.add('bronze_tools')
  player.tell(Text.gold('All five bronze tools forged!'))
})
