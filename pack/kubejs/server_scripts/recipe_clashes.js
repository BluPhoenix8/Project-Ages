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

  // Tough As Nails is gone since 0.6.0 (owner, 2026-11-07), and with it the thermometer (= Supplementaries'
  // altimeter) and the leather canteen (= Eidolon's belt, which has its own four leather again).

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
  // an Aether ring or a Create Deco support (and a Tough As Nails canteen, until 0.6.0). The gears keep that shape.
  swap(['aether:iron_ring'], 'aether:iron_ring', [' # ', '#n#', ' # '],
    { '#': 'minecraft:iron_ingot', n: 'minecraft:iron_nugget' }, 'iron_ring')
  swap(['aether:golden_ring'], 'aether:golden_ring', [' # ', '#n#', ' # '],
    { '#': 'minecraft:gold_ingot', n: 'minecraft:gold_nugget' }, 'golden_ring')
  swap(['createdeco:iron_support'], '4x createdeco:iron_support', [' b ', 'b|b', ' b '],
    { b: 'minecraft:iron_ingot', '|': 'minecraft:stick' }, 'iron_support')
  swap(['createdeco:copper_support'], '4x createdeco:copper_support', [' b ', 'b|b', ' b '],
    { b: 'minecraft:copper_ingot', '|': 'minecraft:stick' }, 'copper_support')

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

  // Silent Gear's paint mixer came out empty (owner, 0.6.0 test 2; the live 0.5.0 too): Silent Gear's quick
  // paint takes any grid with a dye and exactly one of its paintable parts, whatever else is in it, and
  // makes nothing when something else is. The mixer has a dye and an iron rod, and Silent Gear's iron rod
  // is a paintable part. An iron ingot stirs the paint now.
  swap(['silentgear:paint_mixer'], 'silentgear:paint_mixer', ['sds', 'cIc', 'sbs'],
    { s: 'minecraft:smooth_stone', d: '#c:dyes', c: '#c:ingots/copper', I: 'minecraft:iron_ingot', b: '#c:buckets/empty' }, 'paint_mixer')

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

  // 0.6.0's mods (/recipeclash on the 0.6 dev server).
  // Handcrafted's sheets (any three wool) took Comforts' sleeping bags (three wool stacked) in ten colours.
  // Sheets are three wool in a row now.
  ;['white', 'orange', 'magenta', 'light_blue', 'yellow', 'lime', 'pink', 'gray', 'light_gray', 'cyan', 'purple', 'blue', 'brown', 'green', 'red', 'black'].forEach(c => {
    swap([`handcrafted:${c}_sheet`], `8x handcrafted:${c}_sheet`, ['###'], { '#': `minecraft:${c}_wool` }, `${c}_sheet`)
  })
  // Meadow's big flower pot = AlcoCraft's mug (planks in a cup shape), so every mug came out a flower pot.
  // The big pot gets dirt in the middle, like Meadow's small one.
  swap(['meadow:wooden_flower_pot_big'], 'meadow:wooden_flower_pot_big', ['# #', '#B#', ' # '],
    { '#': '#minecraft:planks', B: 'minecraft:dirt' }, 'wooden_flower_pot_big')
  // Farm & Charm's cleavers = Kaleidoscope Cookery's kitchen knives. Cleavers get a wide blade.
  swap(['farm_and_charm:iron_cleaver'], 'farm_and_charm:iron_cleaver', ['III', ' S '],
    { I: 'minecraft:iron_ingot', S: 'minecraft:stick' }, 'iron_cleaver')
  swap(['farm_and_charm:diamond_cleaver'], 'farm_and_charm:diamond_cleaver', ['III', ' S '],
    { I: 'minecraft:diamond', S: 'minecraft:stick' }, 'diamond_cleaver')

  // Three slabs in a row is the item shelf (Supplementaries Squared adds one per wood), but Handcrafted's
  // wood plate (any slabs) and Twilight Forest's drying racks took it, so most woods' shelves came out as
  // plates or racks. The plate is two slabs with a gap now, a drying rack a slab between two sticks.
  swap(['handcrafted:wood_plate'], '2x handcrafted:wood_plate', ['# #'], { '#': '#minecraft:wooden_slabs' }, 'wood_plate')
  ;[['acacia', 'minecraft:acacia_slab'], ['bamboo', 'minecraft:bamboo_slab'], ['birch', 'minecraft:birch_slab'],
    ['canopy', 'twilightforest:canopy_slab'], ['cherry', 'minecraft:cherry_slab'], ['crimson', 'minecraft:crimson_slab'],
    ['dark', 'twilightforest:dark_slab'], ['dark_oak', 'minecraft:dark_oak_slab'], ['jungle', 'minecraft:jungle_slab'],
    ['mangrove', 'twilightforest:mangrove_slab'], ['mining', 'twilightforest:mining_slab'], ['oak', 'minecraft:oak_slab'],
    ['sorting', 'twilightforest:sorting_slab'], ['spruce', 'minecraft:spruce_slab'], ['time', 'twilightforest:time_slab'],
    ['transformation', 'twilightforest:transformation_slab'], ['twilight_oak', 'twilightforest:twilight_oak_slab'],
    ['vangrove', 'minecraft:mangrove_slab'], ['warped', 'minecraft:warped_slab']].forEach(p => {
    swap([`twilightforest:wood/${p[0]}_drying_rack`], `twilightforest:${p[0]}_drying_rack`, ['|-|'],
      { '|': 'minecraft:stick', '-': p[1] }, `${p[0]}_drying_rack`)
  })
  // Supplementaries Squared made item shelves for Domum Ornamentum's two cactus woods, which have no slab in
  // this pack, so both recipes fell back to oak slabs and the plain oak item shelf came out a cactus one.
  event.remove({ id: 'suppsquared:domum_ornamentum/item_shelf_cactus' })
  event.remove({ id: 'suppsquared:domum_ornamentum/item_shelf_cactus_extra' })

  // Fairy Lights' skull light came out empty, like the paint mixer: Silent Gear counts any stick, bone or
  // metal rod as a tool handle, and its quick paint takes a grid with a dye and exactly one handle in it.
  // The skull light (iron, a dye and a bone) is three iron and a bone now; a dye colours it after (Fairy
  // Lights' own recipe, light + dye). Its witch light (a stick and a dye) works: the game finds it first.
  event.remove({ id: 'fairylights:skull_light' })
  event.shaped('4x fairylights:skull_light', [' I ', 'I I', ' B '],
    { I: 'minecraft:iron_ingot', B: 'minecraft:bone' }).id('kubejs:clash/skull_light')
})
