// Farm & Charm (0.6.0) and Farmer's Delight share eleven foods and ingredients by name (owner,
// 2026-11-06: "Merge them"). Farmer's Delight's are the ones that stay: Farm & Charm's recipes take
// and make them instead, its copies leave JEI, and a copy found in the world (an abandoned field, a
// chest) turns into Farmer's Delight's in a crafting grid. Farm & Charm's five wild crops that
// Farmer's Delight also grows stop generating (kubejs/data/farm_and_charm/neoforge/biome_modifier).
// Its cooking pot, stove and cutting board work differently from Farmer's Delight's, so both stay;
// Farm & Charm's are named "Farmhouse ..." (kubejs/assets/farm_and_charm/lang).
// Its machine recipes (mincer, cutting board, pot, stove, roaster) are recipe types KubeJS can't
// edit: tools/scripts/farm_charm_merge.py writes copies of them into kubejs/data/farm_and_charm/recipe
// that use Farmer's Delight's items. Re-run it after updating Farm & Charm.

const PA_FC_MERGED = ['bacon', 'cooked_bacon', 'dog_food', 'minced_beef', 'onion', 'onion_soup', 'raw_pasta',
  'rope', 'rotten_tomato', 'tomato', 'tomato_seeds']
const PA_FC_WILD = ['wild_beetroots', 'wild_carrots', 'wild_onions', 'wild_potatoes', 'wild_tomatoes']

ServerEvents.recipes(event => {
  PA_FC_MERGED.forEach(name => {
    event.replaceInput({}, `farm_and_charm:${name}`, `farmersdelight:${name}`)
    event.replaceOutput({}, `farm_and_charm:${name}`, `farmersdelight:${name}`)
  })
  // After the replacing, so these keep Farm & Charm's item as the input.
  PA_FC_MERGED.forEach(name => {
    event.shapeless(`farmersdelight:${name}`, [`farm_and_charm:${name}`]).id(`kubejs:farm_charm_merge/${name}`)
  })
})

// Two tags its recipes ask for held only its own copy (the stove's roasted chicken takes any pasta).
ServerEvents.tags('item', event => {
  event.add('c:pasta', 'farmersdelight:raw_pasta')
  event.add('farm_and_charm:campfire_meats', 'farmersdelight:cooked_bacon')
})

RecipeViewerEvents.removeEntriesCompletely('item', event => {
  PA_FC_MERGED.concat(PA_FC_WILD).forEach(name => event.remove(`farm_and_charm:${name}`))
})
