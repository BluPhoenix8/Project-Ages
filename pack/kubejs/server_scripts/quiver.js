// Supplementaries' quiver has no recipe of its own (it's only found in chests), so the Odds and Ends quest dropped it
// in 0.6.1. Owner, 0.7.0: "quivers are supposed to be craftable things". Leather and string: Age I, with the rest
// of Supplementaries. (Checked against every other crafting recipe by the build's recipe clash check.)
ServerEvents.recipes(event => {
  event.shaped('supplementaries:quiver', [
    'LSL',
    'L L',
    'LLL'
  ], {
    L: 'minecraft:leather',
    S: 'minecraft:string'
  }).id('kubejs:supplementaries_quiver')
})
