// Create: Northstar (0.4.41). Its rockets land on Ad Astra's planets (kubejs/data/northstar), where
// only Ad Astra's suits keep you alive. Northstar's own suits and oxygen blocks (the list is in
// startup_scripts/northstar_removed.js) lose their recipes and leave JEI.

ServerEvents.recipes(event => {
  global.NORTHSTAR_REMOVED.forEach(id => event.remove({ output: id }))
  // Lunar Sapphire (the Interplanetary Navigator needs it) only grows on Northstar's own Moon,
  // which no rocket leads to: crushing Ad Astra's moon deepslate gives it instead.
  event.custom({
    type: 'create:crushing',
    ingredients: [{ item: 'ad_astra:moon_deepslate' }],
    processing_time: 250,
    results: [{ id: 'ad_astra:moon_sand' }, { id: 'northstar:lunar_sapphire_shard', chance: 0.2 }]
  }).id('kubejs:northstar/lunar_sapphire_from_moon_deepslate')
})

RecipeViewerEvents.removeEntriesCompletely('item', event => {
  global.NORTHSTAR_REMOVED.forEach(id => event.remove(id))
})
