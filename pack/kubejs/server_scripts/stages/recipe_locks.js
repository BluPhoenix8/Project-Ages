// priority: -100
// Locked items can't be crafted. AStages' item locks (mod_gates.js) stop carrying, using and
// placing, but not the crafting grid: a Stone Age player saw Farmer's Delight's flint knife as an
// "Unfamiliar Item" result (owner report, 0.4.40). So every crafting recipe whose result is locked
// is locked until the same age. Runs after every other script's recipes (priority -100), so the
// pack's own recipes are included too.

const $PaRecipeLocks = Java.loadClass('com.alessandro.astages.api.util.ARestrictionUtils')
const $PaRecipeType = Java.loadClass('net.minecraft.world.item.crafting.RecipeType')
const $PaRecipeList = Java.loadClass('java.util.ArrayList')
const $PaRecipeId = Java.loadClass('net.minecraft.resources.ResourceLocation')

// The age an item unlocks in, or null if it's never locked (the same rules as mod_gates.js).
function paLockStage(id) {
  let stage = null
  Object.keys(global.EARLY_ITEMS).forEach(s => { if (global.EARLY_ITEMS[s].indexOf(id) >= 0) stage = s })
  if (stage) return stage == 'age_0' ? null : stage
  Object.keys(global.LATE_ITEMS).forEach(s => { if (global.LATE_ITEMS[s].indexOf(id) >= 0) stage = s })
  if (stage) return stage
  const mod = id.split(':')[0]
  Object.keys(global.MOD_GATES).forEach(s => { if (global.MOD_GATES[s].indexOf(mod) >= 0) stage = s })
  return stage
}

ServerEvents.recipes(event => {
  const byStage = {}
  let unreadable = 0
  event.forEachRecipe({}, recipe => {
    // (var: KubeJS's Rhino rejects const and let here on the second call, "redeclaration of var".)
    var original, result, stage
    try {
      original = recipe.getOriginalRecipe()
      if (!original || original.getType() != $PaRecipeType.CRAFTING) return
      result = recipe.getOriginalRecipeResult()
      if (!result || result.isEmpty()) return
      stage = paLockStage(String(result.id))
      if (!stage) return
      if (!byStage[stage]) byStage[stage] = new $PaRecipeList()
      byStage[stage].add($PaRecipeId.parse(String(recipe.getId())))
    } catch (e) {
      unreadable++ // a recipe KubeJS can't read back; its result stays as its mod made it
      if (unreadable == 1) console.info(`Recipe locks: first unreadable ${recipe.getId()}: ${e}`)
    }
  })
  if (unreadable) console.info(`Recipe locks: ${unreadable} recipes couldn't be read`)
  Object.keys(byStage).forEach(stage => {
    $PaRecipeLocks.addRestrictionForRecipe(`gate/${stage}/crafting`, stage, $PaRecipeType.CRAFTING, byStage[stage])
    console.info(`Recipe locks: ${byStage[stage].size()} crafting recipes wait for ${stage}`)
  })
})
