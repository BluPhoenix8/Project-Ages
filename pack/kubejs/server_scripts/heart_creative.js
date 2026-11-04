// The Heart of the Ages as a creator's tool: every creative item in the pack (none of them
// can be made any other way) is crafted around the Heart, which stays in the grid.
// Corners: the best version of that thing the mod makes. Edges: that mod's top material.
// Audit (0.4.0): every item id with "creative" in it, plus the Sophisticated infinity
// upgrades; debug and admin tools are left out on purpose.

const PA_CREATIVE_RECIPES = [
  // [creative item, corners (x4), edges (x4)]
  ['mekanism:creative_energy_cube', 'mekanism:ultimate_energy_cube', 'mekanism:ultimate_control_circuit'],
  ['mekanism:creative_fluid_tank', 'mekanism:ultimate_fluid_tank', 'mekanism:ultimate_control_circuit'],
  ['mekanism:creative_chemical_tank', 'mekanism:ultimate_chemical_tank', 'mekanism:ultimate_control_circuit'],
  ['mekanism:creative_bin', 'mekanism:ultimate_bin', 'mekanism:ultimate_control_circuit'],
  ['create:creative_motor', 'create:steam_engine', 'create:precision_mechanism'],
  ['create:creative_fluid_tank', 'create:fluid_tank', 'create:precision_mechanism'],
  ['create:creative_crate', 'create:item_vault', 'create:precision_mechanism'],
  ['create:creative_blaze_cake', 'create:blaze_cake', 'create:precision_mechanism'],
  ['create_connected:creative_fluid_vessel', 'create_connected:fluid_vessel', 'create:precision_mechanism'],
  ['createaddition:creative_energy', 'createaddition:modular_accumulator', 'create:precision_mechanism'],
  ['createbigcannons:creative_autocannon_ammo_container', 'createbigcannons:autocannon_ammo_container', 'create:precision_mechanism'],
  ['simulated:creative_physics_staff', 'simulated:physics_assembler', 'create:precision_mechanism'],
  ['ae2:creative_energy_cell', 'megacells:mega_energy_cell', 'megacells:cell_component_256m'],
  ['ae2:creative_storage_cell', 'megacells:item_storage_cell_256m', 'megacells:cell_component_256m'],
  ['immersiveengineering:capacitor_creative', 'immersiveengineering:capacitor_hv', 'immersiveengineering:component_electronic_adv'],
  ['enderio:creative_power', 'enderio:vibrant_capacitor_bank', 'enderio:vibrant_crystal'],
  ['pneumaticcraft:creative_compressor', 'pneumaticcraft:advanced_air_compressor', 'pneumaticcraft:printed_circuit_board'],
  ['pneumaticcraft:creative_upgrade', 'pneumaticcraft:speed_upgrade', 'pneumaticcraft:printed_circuit_board'],
  ['pneumaticcraft:creative_compressed_iron_block', 'pneumaticcraft:compressed_iron_block', 'pneumaticcraft:printed_circuit_board'],
  ['modularrouters:creative_module', 'modularrouters:blank_module', 'modularrouters:speed_upgrade'],
  ['modern_industrialization:creative_barrel', 'modern_industrialization:quantum_barrel', 'modern_industrialization:highly_advanced_machine_hull'],
  ['modern_industrialization:creative_tank', 'modern_industrialization:quantum_tank', 'modern_industrialization:highly_advanced_machine_hull'],
  ['modern_industrialization:creative_storage_unit', 'modern_industrialization:ev_storage_unit', 'modern_industrialization:highly_advanced_machine_hull'],
  ['ars_nouveau:creative_source_jar', 'ars_nouveau:source_jar', 'ars_nouveau:source_gem_block'],
  ['neovitae:activation_crystal_creative', 'neovitae:rune_2_acceleration', 'neovitae:rune_2_charging'],
  ['functionalstorage:creative_vending_upgrade', 'functionalstorage:netherite_upgrade', 'functionalstorage:collector_upgrade'],
  ['sophisticatedstorage:infinity_upgrade', 'sophisticatedstorage:stack_upgrade_omega_tier', 'sophisticatedstorage:stack_upgrade_tier_5'],
  ['sophisticatedstorage:survival_infinity_upgrade', 'sophisticatedstorage:stack_upgrade_omega_tier', 'sophisticatedstorage:stack_upgrade_tier_4'],
  ['sophisticatedbackpacks:infinity_upgrade', 'sophisticatedbackpacks:stack_upgrade_omega_tier', 'sophisticatedbackpacks:stack_upgrade_tier_4'],
  ['sophisticatedbackpacks:survival_infinity_upgrade', 'sophisticatedbackpacks:stack_upgrade_omega_tier', 'sophisticatedbackpacks:stack_upgrade_tier_3']
]
// Items that only need one of their base item.
const PA_CREATIVE_SINGLE = [
  ['ars_nouveau:creative_spell_book', 'ars_nouveau:archmage_spell_book', 'ars_nouveau:source_gem_block'],
  ['mysticalagriculture:creative_soulium_dagger', 'mysticalagriculture:soulium_dagger', 'mysticalagriculture:awakened_supremium_ingot']
]

ServerEvents.recipes(event => {
  const id = out => `kubejs:heart/${out.replace(':', '_')}`
  PA_CREATIVE_RECIPES.forEach(r => {
    event.shaped(r[0], ['CEC', 'EHE', 'CEC'], { C: r[1], E: r[2], H: PA_HEART })
      .keepIngredient(PA_HEART).id(id(r[0]))
  })
  PA_CREATIVE_SINGLE.forEach(r => {
    event.shaped(r[0], ['EBE', 'EHE', 'EEE'], { B: r[1], E: r[2], H: PA_HEART })
      .keepIngredient(PA_HEART).id(id(r[0]))
  })
})
