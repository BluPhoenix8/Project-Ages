// Felling a tree takes effort: the bottom log of a natural tree breaks more slowly the
// bigger the tree is. Tree Physics then topples the whole thing.
// Runs on both sides (startup script) so the client's mining progress matches the server.
// Only natural trees (logs touching leaves the world grew) are slowed; log builds aren't.
// Tuning: PA_TREE_PER_LOGS logs add one more "base time"; PA_TREE_MAX_LOGS caps it.

const PA_TREE_PER_LOGS = 10
const PA_TREE_MAX_LOGS = 64
const $PaBreakSpeed = Java.loadClass('net.neoforged.neoforge.event.entity.player.PlayerEvent$BreakSpeed')
const $PaBlockTags = Java.loadClass('net.minecraft.tags.BlockTags')
const $PaLeaves = Java.loadClass('net.minecraft.world.level.block.LeavesBlock')
let paTreeCache = { key: '', logs: 0 }
// BlockState.is has several overloads; Rhino needs the tag one named explicitly.
function paIs(state, tag) {
  return state['is(net.minecraft.tags.TagKey)'](tag)
}

// Logs in the tree above `start` (up to the cap), or 0 if no grown leaves touch it.
// (var throughout: KubeJS's Rhino rejects const/let inside blocks of a function that runs
// more than once.)
function paTreeSize(level, start) {
  var seen = {}
  var queue = [start]
  var logs = 0
  var natural = false
  seen[start.asLong()] = true
  while (queue.length && logs < PA_TREE_MAX_LOGS) {
    var pos = queue.shift()
    logs++
    for (var dx = -1; dx <= 1; dx++) {
      for (var dy = 0; dy <= 1; dy++) {
        for (var dz = -1; dz <= 1; dz++) {
          var next = pos.offset(dx, dy, dz)
          var key = next.asLong()
          if (seen[key]) continue
          var state = level.getBlockState(next)
          if (paIs(state, $PaBlockTags.LOGS)) {
            seen[key] = true
            queue.push(next)
          } else if (!natural && paIs(state, $PaBlockTags.LEAVES) && state.hasProperty($PaLeaves.PERSISTENT) &&
              !state.getValue($PaLeaves.PERSISTENT)) {
            natural = true
          }
        }
      }
    }
  }
  return natural ? logs : 0
}

NativeEvents.onEvent($PaBreakSpeed, event => {
  const state = event.getState()
  if (!paIs(state, $PaBlockTags.LOGS)) return
  const at = event.getPosition()
  if (!at.isPresent()) return
  const pos = at.get()
  const level = event.getEntity().level
  if (paIs(level.getBlockState(pos.below()), $PaBlockTags.LOGS)) return // only the trunk's base
  const key = `${level.dimension}|${pos.asLong()}`
  if (paTreeCache.key != key) paTreeCache = { key: key, logs: paTreeSize(level, pos) }
  if (paTreeCache.logs <= 3) return
  event.setNewSpeed(event.getNewSpeed() / (1 + paTreeCache.logs / PA_TREE_PER_LOGS))
})
