// priority: 900
// The progression plan as data. Everything that needs to know "what belongs to which
// age" reads from here: the AStages gates (server_scripts/stages/mod_gates.js),
// the tester commands and kits, and the progression audit (tools/scripts/audit.py).
// Startup script because KubeJS only lets startup scripts write to `global`.
// Changes here need a full game/server restart.

// Which mods unlock in which age. Anything from a listed mod is hidden in JEI and
// cannot be crafted, picked up, placed, mined or used until that age.
// Mods not listed are always available (QoL, libraries, world generation,
// Tough As Nails, Alex's Mobs, maps, waystones...).
// "(placeholder)" = the plan does not assign an age; chosen to fit, easy to move.
global.MOD_GATES = {
  age_1: [
    'farmersdelight',
    'cookingforblockheads', // kitchen blocks, beside Farmer's Delight
    'kaleidoscope_cookery', // stoves, cookware and extra recipes, beside Farmer's Delight (0.4.24)
    'alcocraftplus', // AlcoCraft+: brewing, beside Farmer's Delight (0.4.12)
    'supplementaries',
    'handcrafted', // furniture
    'aquaculture', // fishing: rods, lures, new fish
    'rechiseled', // chiseled block variants
    'crafting_on_a_stick', // portable crafting table etc.: never in the Stone Age
    'refurbished_furniture', // MrCrayfish's working furniture
    'mcwbridges', 'mcwstairs', 'mcwfences', 'mcwdoors', 'mcwwindows', 'mcwroofs', 'mcwfurnitures', // Macaw's
    'silentgear' // material tiers inside Silent Gear get gated per age later
  ],
  // Age 1's reward near the end: MineColonies once the player makes bronze.
  age_1_colony: [
    'minecolonies',
    'structurize',
    'domum_ornamentum'
  ],
  age_2: [
    'ars_nouveau',
    'astralsorcery', // the other Age 2 path; official 1.21.1 port (Sept 2026)
    'neovitae', // NeoVitae (Blood Magic for 1.21.1; replaced the unofficial port in 0.4.11), SevTech's other Age 2 magic
    'sophisticatedbackpacks',
    'simplemagnets', // basic magnet (the advanced one waits for Age 5, see LATE_ITEMS)
    'sophisticatedstorage',
    'functionalstorage'
  ],
  age_3: [
    'grapplemod', // grappling hooks: Twilight trees and cliffs (jetpacks come in Age 5)
    'twilightforest',
    'storagenetwork', // Simple Storage Network: between Sophisticated Storage and AE2
    'aether', // (placeholder) sky dimension, exploration age
    'eidolon_repraised', // (placeholder) "mid to late pack"
    'irons_spellbooks', // (placeholder) optional parallel magic path
    'securitycraft' // traps, mines, keycard doors, cameras: base defense and pranks
  ],
  age_4: [
    'create',
    'create_connected',
    'create_hypertube', // Create: Hypertubes
    'createdeco',
    'copycats',
    'sliceanddice',
    'createbigcannons',
    'create_radar', // Create: Radars (radar and guided weapons, with the cannons)
    'escalated', // Create: Escalated (escalators and walkways)
    'create_integrated_farming', // Create: Integrated Farming
    'create_dragons_plus', // library for Integrated Farming, adds a few Create blocks
    'rechiseledcreate', // Rechiseled chiseling with Create
    'sophisticatedstoragecreateintegration', // Sophisticated Storage on contraptions
    'sophisticatedbackpackscreateintegration', // Sophisticated Backpacks on contraptions
    'railways', // unofficial Steam 'n' Rails port
    'productivebees',
    'mob_grinding_utils' // (placeholder)
  ],
  age_5: [
    'create_new_age', // Create: New Age (electricity, generators, nuclear): rotation becomes power here
    'immersiveengineering',
    'immersivepetroleum', // IE add-on: oil and refining
    'immersiveposts', // IE add-on: posts for wires
    'ironjetpacks', // jetpacks run on energy
    'createaddition',
    'occultism',
    'ars_ocultas',
    'industrialforegoing',
    'modern_industrialization',
    'gateways',
    'justdirethings', // (placeholder)
    'modularrouters', // (placeholder)
    'computercraft', // CC: Tweaked: programmable computers and mining turtles
    'webdisplays', // WebDisplays (1.21.1 fork): web screens, YouTube with friends (owner's pick, 0.5.0)
    'mysticalagriculture' // (placeholder) renewable ores would undercut earlier ages
  ],
  // Age 5's staggered unlocks (see SUB_STAGES): AE2 once power is steady, then PneumaticCraft.
  age_5_ae2: [
    'ae2',
    'ae2things',
    'megacells'
  ],
  age_5_pnc: [
    'pneumaticcraft'
  ],
  age_6: [
    'mekanism',
    'mekanismgenerators',
    'enderio', // EnderIO (1.21.1 builds are labelled beta): beside Mekanism
    'fluxnetworks', // wireless power, late game
    'buildinggadgets2', // building gadgets: an advanced-age tool
    'apotheosis',
    'compactmachines',
    'deeperdarker', // (placeholder) "late-game key off the Deep Dark"
    'ballistix', // missiles, launch silos, radar, anti-missile defense
    'voltaic', // Ballistix's library (a few shared parts)
    'tacz' // TaCZ guns (0.5.0, owner: guns without Superb Warfare's tanks and jets), with the Warfare side path
  ],
  // Age 4's reward partway through: airships once the player makes brass.
  age_4_aero: [
    'aeronautics',
    'simulated',
    'offroad',
    'let_it_walk', // Let it Walk!: walking machines on the same Sable physics as the airships (0.4.41)
    'createpropulsion', // Create Propulsion: Simulated: thrusters and engines for ships (0.4.41)
    'aeroworks', // Create: Aeroworks: gyroscopes, joysticks and other ship parts (0.4.41)
    'create_lnl', // Create: Lift n' Load: lifts and cargo parts for Simulated/Aeronautics (0.4.41)
    'create_submarine', 'create_abyss', 'create_high_seas' // Create: Deep Seas: submarines and boats (0.4.41)
  ],
  age_7: [
    'ad_astra',
    'northstar', // Create: Northstar: build-your-own rockets that fly to Ad Astra's planets (0.4.41)
    'cataclysm' // (placeholder) post-game boss content
  ]
}

// Unlocks inside an age, in order. Granted by that age's quests (rewards); a player
// past the age has them all. `/pa age` and `/pa kit` keep them in step.
global.SUB_STAGES = {
  // Crafting your first table: more tables from four planks (server_scripts/age0.js).
  age_0: [
    { stage: 'first_table', title: 'Crafting Tables', subtitle: 'Four planks make another' }
  ],
  age_1: [
    { stage: 'age_1_colony', title: 'MineColonies', subtitle: 'Found your first colony' }
  ],
  age_4: [
    // Crafting your first Mechanical Press (with the Steam Core): more from Create's recipe.
    { stage: 'first_press', title: 'Mechanical Press', subtitle: 'More presses, no Steam Core needed' },
    { stage: 'age_4_aero', title: 'Create Aeronautics', subtitle: 'Take to the skies' }
  ],
  age_5: [
    { stage: 'age_5_ae2', title: 'Applied Energistics', subtitle: 'Digital storage comes online' },
    { stage: 'age_5_pnc', title: 'PneumaticCraft', subtitle: 'Pressure joins the toolbox' }
  ]
}

// Items from a gated mod that unlock earlier than the rest of that mod.
// A metal unlocks for every mod at once: its ores spawn in every world, and an ore whose drop
// stays locked while the same metal from another mod is open just looks broken (0.4.41.1,
// HeavenlyFowl's report: Modern Industrialization's tin ore dropped tin nobody could pick up
// in Age I). So each mod's ore, raw metal, ingot, nugget and blocks of a metal open with the
// earliest one; its dusts, plates and the like stay with their mod.
function paMetal(mod, ids) {
  return ids.map(function (id) { return mod + ':' + id })
}
global.EARLY_ITEMS = {
  // Age 1 needs tin and bronze; Mekanism provides the ore and the bronze ingot.
  age_1: [
    'mekanism:tin_ore',
    'mekanism:deepslate_tin_ore',
    'mekanism:raw_tin',
    'mekanism:block_raw_tin',
    'mekanism:ingot_tin',
    'mekanism:nugget_tin',
    'mekanism:block_tin',
    'mekanism:ingot_bronze',
    'mekanism:nugget_bronze',
    'mekanism:block_bronze'
  ].concat(
    paMetal('modern_industrialization', ['tin_ore', 'deepslate_tin_ore', 'raw_tin', 'raw_tin_block', 'tin_ingot', 'tin_nugget', 'tin_block'])
  ),
  // Lead and silver open with Eidolon (Age 3).
  age_3: [].concat(
    paMetal('immersiveengineering', ['ore_lead', 'deepslate_ore_lead', 'raw_lead', 'raw_block_lead', 'ingot_lead', 'nugget_lead', 'storage_lead']),
    paMetal('modern_industrialization', ['lead_ore', 'deepslate_lead_ore', 'raw_lead', 'raw_lead_block', 'lead_ingot', 'lead_nugget', 'lead_block']),
    paMetal('mekanism', ['lead_ore', 'deepslate_lead_ore', 'raw_lead', 'block_raw_lead', 'ingot_lead', 'nugget_lead', 'block_lead']),
    paMetal('immersiveengineering', ['ore_silver', 'deepslate_ore_silver', 'raw_silver', 'raw_block_silver', 'ingot_silver', 'nugget_silver', 'storage_silver']),
    paMetal('modern_industrialization', ['raw_silver', 'raw_silver_block', 'silver_ingot', 'silver_nugget', 'silver_block']),
    paMetal('occultism', ['silver_ore', 'silver_ore_deepslate', 'raw_silver', 'raw_silver_block', 'silver_ingot', 'silver_nugget', 'silver_block'])
  ),
  // Platinum opens with Create Propulsion (Age 4, with the airships; 0.5.0).
  age_4_aero: paMetal('modern_industrialization', ['platinum_ore', 'raw_platinum', 'raw_platinum_block', 'platinum_ingot', 'platinum_nugget', 'platinum_block']),
  // Uranium opens with Immersive Engineering and Modern Industrialization (Age 5).
  age_5: paMetal('mekanism', ['uranium_ore', 'deepslate_uranium_ore', 'raw_uranium', 'block_raw_uranium', 'ingot_uranium', 'nugget_uranium', 'block_uranium'])
}

// Vanilla items held back until a later age (the opposite of EARLY_ITEMS).
global.LATE_ITEMS = {
  age_5: ['simplemagnets:advancedmagnet', 'simplemagnets:advanced_demagnetization_coil'],
  // The finale (age7_items.js): boss sigils, planet cores, the Emblem and the Heart of the Ages.
  age_7: [
    'kubejs:lunar_sigil',
    'kubejs:lunar_core',
    'kubejs:martian_sigil',
    'kubejs:martian_core',
    'kubejs:venusian_sigil',
    'kubejs:venusian_core',
    'kubejs:mercurian_sigil',
    'kubejs:mercurian_core',
    'kubejs:glacian_sigil',
    'kubejs:glacian_core',
    'kubejs:emblem_of_the_ages',
    'kubejs:heart_of_the_ages'
  ],
  age_2: [
    // "Coal stays gated" in Age 1: charcoal from the bloomery is the fuel.
    'minecraft:coal', 'minecraft:coal_block', 'minecraft:coal_ore', 'minecraft:deepslate_coal_ore',
    // Bronze is the best tool metal of Age 1, so vanilla metal tools wait for Age 2.
    'minecraft:iron_pickaxe', 'minecraft:iron_axe', 'minecraft:iron_shovel', 'minecraft:iron_hoe', 'minecraft:iron_sword',
    'minecraft:golden_pickaxe', 'minecraft:golden_axe', 'minecraft:golden_shovel', 'minecraft:golden_hoe', 'minecraft:golden_sword',
    'minecraft:diamond_pickaxe', 'minecraft:diamond_axe', 'minecraft:diamond_shovel', 'minecraft:diamond_hoe', 'minecraft:diamond_sword',
    'minecraft:netherite_pickaxe', 'minecraft:netherite_axe', 'minecraft:netherite_shovel', 'minecraft:netherite_hoe', 'minecraft:netherite_sword',
    // Metal armour found in chests waits with the metal tools (leather is fine in the Stone Age).
    'minecraft:chainmail_helmet', 'minecraft:chainmail_chestplate', 'minecraft:chainmail_leggings', 'minecraft:chainmail_boots',
    'minecraft:iron_helmet', 'minecraft:iron_chestplate', 'minecraft:iron_leggings', 'minecraft:iron_boots',
    'minecraft:golden_helmet', 'minecraft:golden_chestplate', 'minecraft:golden_leggings', 'minecraft:golden_boots',
    'minecraft:diamond_helmet', 'minecraft:diamond_chestplate', 'minecraft:diamond_leggings', 'minecraft:diamond_boots',
    'minecraft:netherite_helmet', 'minecraft:netherite_chestplate', 'minecraft:netherite_leggings', 'minecraft:netherite_boots'
  ]
}

// Single recipes held back until an age, by recipe id, when what they make is open earlier
// (server_scripts/stages/recipe_locks.js locks them with the rest).
global.RECIPE_GATES = {
  // TaCZ's gunpowder (flint, two sugar, three charcoal: all Stone Age) would make TNT easy from
  // the start. It opens with the guns it's meant for.
  age_6: ['tacz:gunpowder']
}

// Key items that must be obtainable using only what is unlocked at each age.
// The progression audit fails an age if any of these cannot be made.
// "TODO" comments mark gate items that do not exist until that age is scripted.
global.AGE_TARGETS = {
  age_0: [
    'kubejs:plant_string',
    'kubejs:flint_hatchet',
    'minecraft:campfire',
    'toughasnails:empty_leather_canteen',
    'minecraft:crafting_table' // gate to Age 1
  ],
  age_1: [
    'minecraft:blast_furnace', // the Bloomery
    'minecraft:charcoal',
    'minecraft:copper_ingot',
    'mekanism:ingot_tin',
    'kubejs:bronze_blend',
    'mekanism:ingot_bronze',
    'minecraft:furnace',
    'farmersdelight:cooking_pot'
    // Gate: five Silent Gear tools with bronze heads. Silent Gear's part recipes pick
    // materials by stats, which the audit can't read, so the tools themselves aren't listed.
  ],
  age_2: [
    'minecraft:coal', // unlocked this age
    'ars_nouveau:novice_spell_book',
    'ars_nouveau:magebloom_crop',
    'ars_nouveau:magebloom_fiber',
    'ars_nouveau:enchanting_apparatus',
    'ars_nouveau:imbuement_chamber',
    'ars_nouveau:source_gem',
    'ars_nouveau:source_jar',
    'ars_nouveau:volcanic_sourcelink',
    'astralsorcery:tome', // Astral path
    'astralsorcery:lightwell',
    'astralsorcery:altar_resonance',
    'astralsorcery:starmetal_ingot',
    'astralsorcery:infuser',
    'astralsorcery:resonating_gem',
    'kubejs:twilight_key' // gate: lights the Twilight Forest portal (Ars or Astral recipe)
  ],
  age_3: [
    'twilightforest:ironwood_ingot',
    'twilightforest:steeleaf_ingot',
    'kubejs:steam_core' // gate: Ironwood + the Lich's Exanimate Essence
  ],
  age_4: [
    'create:andesite_alloy',
    'create:water_wheel',
    'create:mechanical_press',
    'create:mechanical_mixer',
    'create:steam_engine',
    'create:crushing_wheel',
    'create:brass_ingot',
    'aeronautics:levitite', // airships (sub-stage age_4_aero, from the Brass quest)
    'create:mechanical_crafter',
    'create:precision_mechanism' // gate: 16 of them (production target)
  ],
  age_5: [
    'immersiveengineering:coal_coke',
    'immersiveengineering:ingot_steel',
    'immersiveengineering:windmill',
    'immersiveengineering:dynamo',
    'immersiveengineering:capacitor_mv', // unlocks AE2
    'createaddition:electric_motor',
    'ae2:inscriber',
    'ae2:controller', // with a drive and a cell: unlocks PneumaticCraft
    'pneumaticcraft:air_compressor',
    'immersiveengineering:capacitor_hv' // gate: two of them fully charged
  ],
  age_6: [
    'mekanism:metallurgic_infuser',
    'mekanism:alloy_infused',
    'mekanism:enrichment_chamber',
    'mekanism:electrolytic_separator',
    'mekanism:purification_chamber',
    'mekanism:chemical_injection_chamber',
    'mekanism:chemical_dissolution_chamber',
    'mekanism:isotopic_centrifuge',
    'mekanismgenerators:fission_reactor_casing',
    'mekanism:pellet_plutonium' // gate: 4 of them (only fission waste makes plutonium)
  ],
  age_7: [
    'ad_astra:nasa_workbench',
    'ad_astra:fuel_refinery',
    'ad_astra:launch_pad',
    'ad_astra:tier_1_rocket',
    'ad_astra:space_helmet',
    'ad_astra:oxygen_loader',
    'ad_astra:oxygen_distributor', // base parts
    'ad_astra:solar_panel',
    'ad_astra:water_pump',
    'mekanism:qio_drive_base', // needs desh from the Moon now
    'mekanism:mekasuit_helmet', // needs ostrum from Mars now
    'mekanismgenerators:fusion_reactor_frame', // needs calorite from Venus now
    'mekanism:sps_casing', // needs calorite from Venus now
    'kubejs:emblem_of_the_ages', // the finale
    'kubejs:heart_of_the_ages'
  ]
}

// Completion kits: extras for `/pa kit <age>`. Every item a quest asks for is added
// automatically from the quests (03_quest_kits.js, generated); these lists add what that
// can't: materials for things you must craft yourself (the crafting table, bronze tools,
// the Steam Core, the space base) and supplies for portals.
global.COMPLETE_KITS = {
  age_0: [
    '3x kubejs:plant_fibre', 'kubejs:plant_string', '2x minecraft:flint', '2x minecraft:stick',
    'kubejs:flint_hatchet', '8x minecraft:oak_planks', // 4 for the quest, 4 to craft the table
    'minecraft:campfire', 'toughasnails:leather_purified_water_canteen'
  ],
  age_1: [
    'minecraft:crafting_table', '16x minecraft:clay_ball', 'minecraft:stone_pickaxe',
    'minecraft:blast_furnace', '8x minecraft:charcoal', '8x minecraft:copper_ingot',
    '8x mekanism:ingot_tin', '4x kubejs:bronze_blend', '32x mekanism:ingot_bronze',
    // The five bronze tools: templates + bronze for the heads, sticks for the rods.
    '4x silentgear:template_board', 'silentgear:pickaxe_template', 'silentgear:axe_template',
    'silentgear:shovel_template', 'silentgear:hoe_template', 'silentgear:sword_template',
    '16x minecraft:stick',
    'farmersdelight:cooking_pot', 'toughasnails:water_purifier'
  ],
  age_2: [
    'ars_nouveau:novice_spell_book', 'ars_nouveau:magebloom_crop', '16x ars_nouveau:magebloom_fiber',
    '8x ars_nouveau:source_gem', 'ars_nouveau:imbuement_chamber', 'ars_nouveau:source_jar',
    'ars_nouveau:volcanic_sourcelink', 'ars_nouveau:enchanting_apparatus', 'ars_nouveau:arcane_core',
    '6x ars_nouveau:arcane_pedestal', 'kubejs:twilight_key',
    // For the portal: a 2x2 pool ringed with flowers.
    '4x minecraft:water_bucket', '12x minecraft:poppy',
    'sophisticatedbackpacks:backpack', 'functionalstorage:oak_1'
  ],
  age_3: [
    // Holding the bosses' trophies counts as beating them (Twilight Forest's own rule),
    // which also lifts the forest's curses for the tester.
    'twilightforest:naga_trophy', 'twilightforest:lich_trophy',
    // Ironwood quest (4) + Steam Core (4), and the rest of the Steam Core.
    '8x twilightforest:ironwood_ingot', 'twilightforest:exanimate_essence',
    'minecraft:water_bucket', '2x mekanism:ingot_bronze', 'minecraft:blast_furnace',
    // Optional Aether quest: a 4x5 glowstone frame (corners optional) lit with water.
    '10x minecraft:glowstone', 'minecraft:water_bucket', 'minecraft:crafting_table'
  ],
  age_4: [
    '16x create:andesite_alloy', 'create:goggles', 'create:hand_crank', 'create:water_wheel',
    'create:windmill_bearing', 'create:steam_engine', 'create:mechanical_press',
    'create:mechanical_mixer', 'create:basin', '8x create:brass_ingot', '2x create:crushing_wheel',
    'create:mechanical_crafter', '16x create:precision_mechanism', // the gate: opens Age 5
    'sliceanddice:slicer', 'productivebees:advanced_oak_beehive', 'create:track_station'
  ],
  age_5: [
    'immersiveengineering:hammer', '8x immersiveengineering:coal_coke', '8x immersiveengineering:ingot_steel',
    'immersiveengineering:windmill', 'immersiveengineering:dynamo',
    '4x immersiveengineering:wirecoil_copper', '2x immersiveengineering:connector_lv',
    'immersiveengineering:capacitor_mv', '8x ae2:certus_quartz_crystal', 'ae2:inscriber',
    'ae2:controller', 'ae2:drive', 'ae2:item_storage_cell_1k', 'pneumaticcraft:air_compressor',
    // The gate: two HV capacitors already full (4,000,000 Flux each).
    '2x immersiveengineering:capacitor_hv[immersiveengineering:energy=4000000]',
    'createaddition:alternator', 'occultism:dictionary_of_spirits', 'megacells:bulk_item_cell',
    'ae2things:disk_drive_1k'
  ],
  age_6: [
    'mekanism:metallurgic_infuser', '4x mekanism:alloy_infused', 'mekanism:enrichment_chamber',
    'mekanism:electrolytic_separator', 'mekanism:purification_chamber',
    'mekanism:chemical_injection_chamber', 'mekanism:chemical_dissolution_chamber',
    'mekanism:chemical_washer', 'mekanism:chemical_crystallizer', '8x mekanism:ingot_uranium',
    'mekanism:isotopic_centrifuge', '16x mekanismgenerators:fission_reactor_casing',
    'mekanismgenerators:fission_fuel_assembly', 'mekanismgenerators:control_rod_assembly',
    '2x mekanismgenerators:fission_reactor_port', 'mekanismgenerators:fission_reactor_logic_adapter',
    '4x mekanism:pellet_plutonium', // the gate: opens Age 7
    'compactmachines:personal_shrinking_device', 'deeperdarker:heart_of_the_deep'
  ],
  age_7: [
    'ad_astra:nasa_workbench', 'ad_astra:fuel_refinery', '6x ad_astra:fuel_bucket',
    'ad_astra:space_helmet', 'ad_astra:space_suit', 'ad_astra:space_pants', 'ad_astra:space_boots',
    'ad_astra:oxygen_loader', 'ad_astra:launch_pad', 'ad_astra:tier_1_rocket',
    'ad_astra:tier_2_rocket', 'ad_astra:tier_3_rocket', 'ad_astra:tier_4_rocket',
    // The Northstar path: a small rocket's parts (the quest asks for the station, controls and a
    // thruster) and what it takes to fly it to every planet.
    'northstar:rocket_station', 'northstar:rocket_controls', '4x northstar:rocket_thruster',
    'northstar:interplanetary_navigator', 'northstar:space_atlas', 'northstar:telescope', 'northstar:astronomy_table',
    '3x create:fluid_tank', '2x create:super_glue', 'create:white_seat', '8x minecraft:iron_block', '16x minecraft:paper',
    'ad_astra:netherite_space_helmet', 'ad_astra:netherite_space_suit', 'ad_astra:netherite_space_pants', 'ad_astra:netherite_space_boots',
    '8x ad_astra:desh_ingot', '8x ad_astra:ostrum_ingot', '8x ad_astra:calorite_ingot',
    // The base: place all of these on one planet (see server_scripts/age7.js).
    'ad_astra:oxygen_distributor', 'ad_astra:solar_panel', 'ad_astra:water_pump',
    'minecraft:red_bed', '4x minecraft:dirt', 'minecraft:iron_hoe', '8x minecraft:wheat_seeds'
  ]
}

// Arrival kits: roughly what a player would carry on arriving at each age.
// Used by `/pa start <age>`. First drafts: each age's kit gets
// refined when that age is scripted (e.g. bronze tools replace iron once Age 1 exists).
global.AGE_KITS = {
  age_1: [
    'minecraft:crafting_table', 'kubejs:flint_hatchet', 'minecraft:campfire',
    '16x minecraft:oak_log', '8x minecraft:oak_planks', '16x minecraft:stick',
    '8x minecraft:flint', '8x kubejs:plant_string', '16x minecraft:cooked_beef',
    'toughasnails:leather_purified_water_canteen'
  ],
  age_2: [
    // Stand-ins for the five bronze Silent Gear tools a real player would have
    // (Silent Gear tools can't be handed out as plain item ids).
    'minecraft:iron_pickaxe', 'minecraft:iron_axe', 'minecraft:iron_shovel', 'minecraft:iron_sword',
    'minecraft:furnace', 'minecraft:blast_furnace', 'farmersdelight:cooking_pot',
    '16x mekanism:ingot_bronze', '32x minecraft:charcoal',
    '32x minecraft:copper_ingot', '32x mekanism:ingot_tin', '16x minecraft:iron_ingot',
    '8x minecraft:gold_ingot', '16x minecraft:lapis_lazuli',
    '64x minecraft:cobblestone', '32x minecraft:oak_log', '16x minecraft:bread',
    'toughasnails:leather_purified_water_canteen'
  ],
  age_3: [
    'minecraft:iron_pickaxe', 'minecraft:iron_axe', 'minecraft:iron_sword', 'minecraft:shield',
    'minecraft:iron_helmet', 'minecraft:iron_chestplate', 'minecraft:iron_leggings', 'minecraft:iron_boots',
    'minecraft:bow', '64x minecraft:arrow',
    'ars_nouveau:novice_spell_book', 'ars_nouveau:source_jar',
    'sophisticatedbackpacks:backpack',
    '32x minecraft:iron_ingot', '8x minecraft:diamond', '32x minecraft:golden_carrot',
    'toughasnails:leather_purified_water_canteen'
  ],
  age_4: [
    'minecraft:diamond_pickaxe', 'minecraft:iron_axe', 'minecraft:diamond_sword',
    'minecraft:iron_helmet', 'minecraft:iron_chestplate', 'minecraft:iron_leggings', 'minecraft:iron_boots',
    '16x twilightforest:ironwood_ingot', '8x twilightforest:naga_scale',
    '64x minecraft:iron_ingot', '64x minecraft:copper_ingot', '32x minecraft:gold_ingot',
    '64x minecraft:andesite', '64x minecraft:oak_log', '32x minecraft:golden_carrot',
    'sophisticatedbackpacks:backpack'
  ],
  age_5: [
    'minecraft:diamond_pickaxe', 'minecraft:diamond_axe', 'minecraft:diamond_sword',
    'minecraft:diamond_helmet', 'minecraft:diamond_chestplate', 'minecraft:diamond_leggings', 'minecraft:diamond_boots',
    'create:wrench', 'create:goggles',
    '64x create:andesite_alloy', '32x create:brass_ingot', '16x create:precision_mechanism',
    '64x minecraft:iron_ingot', '64x minecraft:copper_ingot', '32x minecraft:redstone',
    '32x minecraft:golden_carrot', 'sophisticatedbackpacks:iron_backpack'
  ],
  age_6: [
    'minecraft:diamond_pickaxe', 'minecraft:diamond_axe', 'minecraft:diamond_sword',
    'minecraft:diamond_helmet', 'minecraft:diamond_chestplate', 'minecraft:diamond_leggings', 'minecraft:diamond_boots',
    'immersiveengineering:hammer', 'create:wrench',
    '64x immersiveengineering:ingot_steel', '64x minecraft:iron_ingot', '64x minecraft:copper_ingot',
    '32x minecraft:gold_ingot', '64x minecraft:redstone', '16x minecraft:diamond',
    '16x ae2:certus_quartz_crystal', '32x minecraft:golden_carrot', 'sophisticatedbackpacks:gold_backpack'
  ],
  age_7: [
    'minecraft:netherite_pickaxe', 'minecraft:diamond_axe', 'minecraft:netherite_sword',
    'minecraft:diamond_helmet', 'minecraft:diamond_chestplate', 'minecraft:diamond_leggings', 'minecraft:diamond_boots',
    '64x mekanism:ingot_steel', '64x mekanism:ingot_osmium', '32x mekanism:alloy_infused',
    '16x mekanism:alloy_reinforced', '32x minecraft:diamond', '64x minecraft:redstone',
    '32x minecraft:golden_carrot', 'sophisticatedbackpacks:diamond_backpack'
  ]
}
