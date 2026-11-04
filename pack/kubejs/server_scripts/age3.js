// Age 3: The Twilight.
// The exploration age. Twilight Forest gates itself (areas stay cursed until the boss
// before them falls); the pack only points at it: Naga, then Lich.
//
// Chain: Naga -> Lich (drops Exanimate Essence); liveroot + raw iron + gold nugget ->
//        raw ironwood -> ironwood ingots; ironwood + essence + bronze + water + Bloomery
//        -> Steam Core.
// Gate to Age 4: crafting the Steam Core. Twilight materials are a one-time unlock:
// the Steam Core is the only recipe in the pack that asks for them.

const AGE_4 = 'age_4'

ServerEvents.recipes(event => {
  event.shaped('kubejs:steam_core', [
    'IWI',
    'BEB',
    'IFI'
  ], {
    I: 'twilightforest:ironwood_ingot',
    W: 'minecraft:water_bucket', // the bucket comes back
    B: '#c:ingots/bronze',
    E: 'twilightforest:exanimate_essence',
    F: 'minecraft:blast_furnace' // the Bloomery
  }).id('kubejs:age3/steam_core')
})

// Each player opens Age 4 with their own Steam Core (ages are per player; the Lich drops
// extra essence for every player in the fight). The gate quest grants the age once every
// Age III quest is done; crafting one early just gets a reminder.
ItemEvents.crafted('kubejs:steam_core', event => {
  const player = event.player
  if (AStages.playerHasStage(player, AGE_4)) return
  player.tell(Text.gold('A Steam Core! Age IV opens once every Age III quest is done (check the quest book).'))
})
