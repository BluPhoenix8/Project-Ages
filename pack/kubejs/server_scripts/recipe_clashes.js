// Recipes that came out identical to another mod's (same items in the same shape), so the crafting
// table only ever made one of them: a CurseForge player could never craft the Tough As Nails
// thermometer, it always came out as Supplementaries' altimeter (2026-11-06). A pack-wide scan found
// the rest below. Each time, the one that loses gets a new shape that nothing else uses. To look for
// new clashes after adding mods: /recipeclash on the dev server (tools/scripts/selftests/
// zz_recipeclash_selftest.js). Same-metal duplicates (another mod's copper nugget, steel ingot...)
// and two decorations sharing a recipe are left alone: either result is usable.

ServerEvents.recipes(event => {
  const swap = (oldIds, out, pattern, key, newId) => {
    oldIds.forEach(id => event.remove({ id: id }))
    event.shaped(out, pattern, key).id('kubejs:clash/' + newId)
  }

  // Thermometer = Supplementaries' altimeter (four copper around redstone). Now a glass bottle at the bottom.
  swap(['toughasnails:thermometer'], 'toughasnails:thermometer', [' C ', 'CRC', ' B '],
    { C: 'minecraft:copper_ingot', R: 'minecraft:redstone', B: 'minecraft:glass_bottle' }, 'thermometer')

  // Eidolon's belt = Tough As Nails' leather canteen (four leather). The belt gets a gold buckle.
  swap(['eidolon_repraised:basic_belt'], 'eidolon_repraised:basic_belt', [' L ', 'LGL', ' L '],
    { L: 'minecraft:leather', G: 'minecraft:gold_ingot' }, 'basic_belt')

  // Handcrafted's cupboards = Functional Storage's drawers (eight planks around a chest), every wood.
  // Drawers are in the Age 2 quests; cupboards now go around a barrel.
  ;['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak', 'mangrove', 'cherry', 'bamboo', 'crimson', 'warped'].forEach(wood => {
    swap([`handcrafted:${wood}_cupboard`], `3x handcrafted:${wood}_cupboard`, ['###', '#B#', '###'],
      { '#': `minecraft:${wood}_planks`, B: 'minecraft:barrel' }, `${wood}_cupboard`)
  })

  // Occultism's large candle = Eidolon's candle (string over tallow), a magic quest item. Large = two tallow.
  swap(['occultism:crafting/large_candle'], 'occultism:large_candle', ['s', 't', 't'],
    { s: '#c:strings', t: '#c:tallow' }, 'large_candle')

  // Four ingots in a diamond made an Industrial Foregoing gear (37 machines need them, EnderIO's too),
  // an Aether ring, a Create Deco support or a Tough As Nails canteen. The gears keep that shape.
  swap(['aether:iron_ring'], 'aether:iron_ring', [' # ', '#n#', ' # '],
    { '#': 'minecraft:iron_ingot', n: 'minecraft:iron_nugget' }, 'iron_ring')
  swap(['aether:golden_ring'], 'aether:golden_ring', [' # ', '#n#', ' # '],
    { '#': 'minecraft:gold_ingot', n: 'minecraft:gold_nugget' }, 'golden_ring')
  swap(['createdeco:iron_support'], '4x createdeco:iron_support', [' b ', 'b|b', ' b '],
    { b: 'minecraft:iron_ingot', '|': 'minecraft:stick' }, 'iron_support')
  swap(['createdeco:copper_support'], '4x createdeco:copper_support', [' b ', 'b|b', ' b '],
    { b: 'minecraft:copper_ingot', '|': 'minecraft:stick' }, 'copper_support')
  ;[['copper', 'minecraft:copper_ingot'], ['iron', 'minecraft:iron_ingot'], ['gold', 'minecraft:gold_ingot'], ['diamond', 'minecraft:diamond']].forEach(p => {
    swap([`toughasnails:empty_${p[0]}_canteen`], `toughasnails:empty_${p[0]}_canteen`, [' # ', '#B#', ' # '],
      { '#': p[1], B: 'minecraft:glass_bottle' }, `${p[0]}_canteen`)
  })

  // Domum Ornamentum's cream bricks (any two sandstone + two bricks) also took Immersive Engineering's
  // alloy bricks (sandstone and bricks crossed), which the alloy kiln is built from. Sandstone over bricks now.
  swap(['domum_ornamentum:cream_bricks'], '4x domum_ornamentum:cream_bricks', ['ss', 'bb'],
    { s: 'minecraft:sandstone', b: 'minecraft:brick' }, 'cream_bricks')

  // Four plates in a square: Create Deco sheet metal took Modern Industrialization's large iron plate and
  // Create Big Cannons' cartridge sheet (brass, copper); Northstar sheet metal took MI's large titanium and
  // tungsten plates. The large plates and cartridge sheets keep the square; the sheet metal takes more
  // plates for the same amount (a ring of eight, or two rows for Northstar, whose ring is its grate).
  ;[['createdeco:iron_sheet_metal', 'iron'], ['createdeco:brass_sheet_metal', 'brass'], ['createdeco:copper_sheet_metal', 'copper']].forEach(p => {
    swap([p[0]], '8x ' + p[0], ['mmm', 'm m', 'mmm'], { m: `#c:plates/${p[1]}` }, p[0].split(':')[1])
  })
  ;[['northstar:titanium_sheetmetal', 'titanium'], ['northstar:tungsten_sheetmetal', 'tungsten']].forEach(p => {
    swap([p[0]], '6x ' + p[0], ['mmm', 'mmm'], { m: `#c:plates/${p[1]}` }, p[0].split(':')[1])
  })

  // Create Radar's radar plate = Ad Astra's iron plating (nine iron plates). The radar plate gets redstone in the middle.
  swap(['create_radar:cutting/radar_plate'], 'create_radar:radar_plate_block', ['III', 'IRI', 'III'],
    { I: '#c:plates/iron', R: 'minecraft:redstone' }, 'radar_plate')

  // Supplementaries' suspicious sand (sand + any one item) caught the other two-item recipes with sand:
  // Create's sand paper (paper + sand gave suspicious sand; polished rose quartz needs the paper),
  // Productive Bees' sand nest and SecurityCraft's sand mine. Each takes a second sand now.
  const twoSand = (oldId, out, other, sand, newId) => {
    event.remove({ id: oldId })
    event.shapeless(out, [other, sand, sand]).id('kubejs:clash/' + newId)
  }
  twoSand('create:crafting/materials/sand_paper', 'create:sand_paper', 'minecraft:paper', '#c:sands/colorless', 'sand_paper')
  twoSand('productivebees:nests/sand_nest', 'productivebees:sand_nest', 'minecraft:wooden_sword', 'minecraft:sand', 'sand_nest')
  twoSand('securitycraft:sand_mine', 'securitycraft:sand_mine', 'securitycraft:mine', 'minecraft:sand', 'sand_mine')
})
