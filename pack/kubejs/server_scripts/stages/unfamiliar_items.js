// Backstop for AStages: every two seconds, anything a player isn't allowed to carry yet is
// thrown out of their inventory ("Unfamiliar Item"), as AStages itself does. AStages tracks
// "which inventory changed" in one place shared by everyone, so with several players online
// it can check the wrong player and miss a locked item; this catches those.
// (Creative and spectator players are left alone.)

const $PaLockManager = Java.loadClass('com.alessandro.astages.engine.ARestrictionManager')
const $PaLockHolder = Java.loadClass('com.alessandro.astages.api.holder.AHolder')
const $PaLockEmpty = Java.loadClass('net.minecraft.world.item.ItemStack').EMPTY

// Throws out every locked item; returns how many stacks went.
function paDropUnfamiliar(player) {
  var holder = $PaLockHolder.serverAndPlayer(player)
  var inv = player.getInventory()
  var dropped = 0
  for (var i = 0; i < inv.getContainerSize(); i++) {
    var stack = inv.getItem(i)
    if (stack.isEmpty() || !$PaLockManager.ITEM_INSTANCE.getInventoryRestriction(holder, stack)) continue
    inv.setItem(i, $PaLockEmpty)
    player.drop(stack, false)
    dropped++
  }
  if (dropped) player.setStatusMessage(Text.red("You don't know how to use that yet."))
  return dropped
}

PlayerEvents.tick(event => {
  var player = event.player
  if (player.tickCount % 40 != 0 || player.isCreative() || player.isSpectator()) return
  paDropUnfamiliar(player)
})
