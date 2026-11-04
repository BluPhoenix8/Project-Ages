// New players start with the quest book and the Chronicle of Ages (chronicle.js), nothing else.
// Known join gifts (guidebooks, blueprint packages) are also switched off in their
// mods' configs; this sweep catches any we missed. It runs once per player, a
// second after their very first join so other mods have already handed out items.

const FIRST_JOIN_FLAG = 'project_ages_starter_given'

// Join gifts that can't be switched off in a config. AStages throws items from
// locked mods out of the inventory straight away, so these get cleaned up on the
// ground too. Only these exact items are removed, never anything else nearby.
const UNWANTED_JOIN_GIFTS = [
  'ars_nouveau:starbuncle_plush' // Ars Nouveau's one-time promo for its real-life plush
]

PlayerEvents.loggedIn(event => {
  const player = event.player
  if (player.persistentData.getBoolean(FIRST_JOIN_FLAG)) return
  player.persistentData.putBoolean(FIRST_JOIN_FLAG, true)
  event.server.scheduleInTicks(20, () => {
    player.inventory.clearContent()
    UNWANTED_JOIN_GIFTS.forEach(id => {
      event.server.runCommandSilent(
        `execute as ${player.uuid} at @s run kill @e[type=minecraft:item,distance=..8,nbt={Item:{id:"${id}"}}]`)
    })
    player.give('ftbquests:book')
    player.give(paChronicleBook()) // after the sweep, or it would be cleared too
  })
})
