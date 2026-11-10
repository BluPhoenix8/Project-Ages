// Polymorph (0.7.0, owner: "I would like to use polymorph... so we don't have to change recipes"): when two
// recipes share a pattern, Polymorph lets you pick which one you want. But it puts the crafting result in
// itself, after the check AStages makes in the crafting grid, so a recipe you haven't unlocked could show up
// there (0.6.0's craft-lock test: diamond shards for a Stone Age player). Here, every tick, for a player with
// a crafting grid open (their own 2x2 or a table), a result from a recipe they haven't unlocked, or one
// they can't hold yet, is taken back out.

const $PgResult = Java.loadClass('net.minecraft.world.inventory.ResultContainer')
const $PgLocks = Java.loadClass('com.alessandro.astages.engine.ARestrictionManager')
const $PgHolder = Java.loadClass('com.alessandro.astages.api.holder.AHolder')
const $PgRecipe = Java.loadClass('com.alessandro.astages.api.wrapper.RecipeWrapper')
// FastWorkbench sends the chosen recipe to the player's game, which then shows the result by itself: emptying
// the server's slot left a result on screen that couldn't be taken (owner, 0.7.0 test 5: the four-plank table
// at a fresh Stone Age, Cataclysm's stone tiles at Age II). Its "no recipe" message clears it there too.
const $PgFastRecipe = Java.loadClass('dev.shadowsoffire.fastbench.net.RecipePayload')
const $PgPayloadPacket = Java.loadClass('net.minecraft.network.protocol.common.ClientboundCustomPayloadPacket')
const $PgEmpty = Java.loadClass('net.minecraft.world.item.ItemStack').EMPTY

// true if it took a locked result away
function paPolymorphGuard(player) {
  var menu = player.containerMenu
  if (!menu || menu.slots.size() == 0) return false
  var rc = menu.getSlot(0).container
  if (!(rc instanceof $PgResult)) return false
  var stack = rc.getItem(0)
  if (stack.isEmpty()) return false
  var holder = $PgHolder.serverAndPlayer(player)
  var locked = false
  var used = rc.getRecipeUsed()
  if (used) locked = $PgLocks.RECIPE_INSTANCE.getRestriction(holder, new $PgRecipe(used.value().getType(), used.id())) != null
  if (!locked) locked = !!$PgLocks.ITEM_INSTANCE.getInventoryRestriction(holder, stack)
  if (!locked) return false
  rc.clearContent()
  menu.broadcastChanges()
  try { player.connection.send(new $PgPayloadPacket(new $PgFastRecipe($PgFastRecipe.NULL, $PgEmpty))) } catch (err) { }
  return true
}

// Creative players too: AStages locks their items as well (0.7.0 test 6), so they mustn't craft locked ones.
PlayerEvents.tick(event => {
  try { paPolymorphGuard(event.player) } catch (err) { }
})
