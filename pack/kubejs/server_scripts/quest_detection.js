// FTB Quests only checks "have this item" quests when the inventory changes, in one pass.
// A quest that unlocks while you already carry its items (chained quests, items picked up
// early, a /pa kit) would wait until the next pickup. Re-check every few seconds instead.

const $QuestInventoryListener = Java.loadClass('dev.ftb.mods.ftbquests.util.FTBQuestsInventoryListener')
const $EmptyStack = Java.loadClass('net.minecraft.world.item.ItemStack').EMPTY

const QUEST_RECHECK_TICKS = 100

PlayerEvents.tick(event => {
  const player = event.player
  if (player.tickCount % QUEST_RECHECK_TICKS != 0) return
  $QuestInventoryListener.detect(player, $EmptyStack, 0)
})
