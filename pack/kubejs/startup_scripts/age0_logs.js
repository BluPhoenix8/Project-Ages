// Logs can't be broken without an axe: their break speed is zero, so they don't
// crack at all (like bedrock) instead of breaking and popping back.
// Startup script so it runs on both client (no crack animation) and server.
// The "you need a hatchet" hint is sent from server_scripts/age0.js when you start hitting.
//
// BlockState.is(...) has several Java overloads KubeJS's script engine can't choose
// between, so the block tag is checked through its getTags() stream; the held item uses
// KubeJS's own hasTag(). Verified by `/pa selftest`.
// Jade also calls this event (for its harvest hint), so an error here breaks Jade.

const $BreakSpeed = Java.loadClass('net.neoforged.neoforge.event.entity.player.PlayerEvent$BreakSpeed')
const $BlockTags = Java.loadClass('net.minecraft.tags.BlockTags')

NativeEvents.onEvent($BreakSpeed, event => {
  const player = event.getEntity()
  if (player.isCreative()) return
  // (The chopping block's log is handled in chopping_block.js.)
  if (!event.getState().getTags().anyMatch(tag => tag.equals($BlockTags.LOGS))) return
  if (player.getMainHandItem().hasTag('minecraft:axes')) return
  event.setNewSpeed(0)
})
