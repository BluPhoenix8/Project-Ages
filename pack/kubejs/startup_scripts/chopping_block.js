// The chopping block (the blocks themselves are in age0_items.js): hold left-click on it with
// an axe and it takes the next log the player carries (the off-hand first, then the inventory),
// sets it on the block and splits it into two planks, log after log while they hold on.
// Right-clicking a log (in either hand) onto it sets it there too; an empty hand takes it back.
// A log is never placed on or against the block by a right-click.
//
// Done so the player's game never guesses ahead of the server (it used to "break" the block
// for a moment when a chop finished, and show a log placed above the block for a moment):
// - A loaded block never breaks (break speed 0 on both sides). While a player holds an axe
//   on it, the server adds up the chop each tick, shows the cracks and splits the log.
// - With an axe in hand the empty stump doesn't break either, so holding on after a chop
//   doesn't knock it loose. Pick the stump up by hand.
// - Right-clicks that load or unload a log are cancelled in the player's game; the click
//   still reaches the server, which does the work and sends the result.
// Startup script so it runs on both sides (and loads once: in singleplayer KubeJS loads
// server scripts twice). getServer() is null in the player's game, so it tells the sides
// apart. var, not const/let, inside functions: KubeJS's script engine rejects block-scoped
// declarations in functions that run more than once.
// Which log sits on which block: server data "pa_chop_logs", "<dimension>|x,y,z" -> log id,
// so modded logs give their own planks (they show as oak).

const $PaChopBreakSpeed = Java.loadClass('net.neoforged.neoforge.event.entity.player.PlayerEvent$BreakSpeed')
const $PaChopRightClick = Java.loadClass('net.neoforged.neoforge.event.entity.player.PlayerInteractEvent$RightClickBlock')
const $PaChopLeftClick = Java.loadClass('net.neoforged.neoforge.event.entity.player.PlayerInteractEvent$LeftClickBlock')
const $PaChopBreak = Java.loadClass('net.neoforged.neoforge.event.level.BlockEvent$BreakEvent')
const $PaChopResult = Java.loadClass('net.minecraft.world.InteractionResult')
const $PaChopHand = Java.loadClass('net.minecraft.world.InteractionHand')
const $PaChopTag = Java.loadClass('net.minecraft.nbt.CompoundTag')
const $PaChopRecipeType = Java.loadClass('net.minecraft.world.item.crafting.RecipeType')
const $PaChopInput = Java.loadClass('net.minecraft.world.item.crafting.CraftingInput')
const $PaChopList = Java.loadClass('java.util.List')
const $PaChopRegistry = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const $PaChopRL = Java.loadClass('net.minecraft.resources.ResourceLocation')
const $PaChopBlock = Java.loadClass('net.minecraft.world.level.block.Block')
// A chop takes as long as mining a block this hard: about 3 seconds with a flint hatchet.
const PA_CHOP_EFFORT = 4
// Chops in progress: "<player id>|<block position>" -> progress, crack stage, last tick.
const paChops = {}
// Log id -> the planks it crafts into (looked up from the recipes on first use).
const paChopPlankCache = {}

function paChopBlockId(state) {
  return String(state.getBlock().builtInRegistryHolder().key().location())
}

function paChopKey(level, pos) {
  return `${level.dimension}|${pos.getX()},${pos.getY()},${pos.getZ()}`
}

function paChopLogs(server) {
  var data = server.persistentData
  if (!data.contains('pa_chop_logs')) data.put('pa_chop_logs', new $PaChopTag())
  return data.getCompound('pa_chop_logs')
}

// The planks one log of this kind crafts into, or null if it makes none (both remembered:
// the inventory is searched every tick while a player hits an empty block).
function paChopPlanks(level, logId) {
  logId = String(logId)
  if (logId in paChopPlankCache) return paChopPlankCache[logId]
  var plank = null
  try {
    var input = $PaChopInput.of(1, 1, $PaChopList.of(Item.of(logId)))
    var found = level.getServer().getRecipeManager().getRecipesFor($PaChopRecipeType.CRAFTING, input, level)
    for (var i = 0; i < found.size() && !plank; i++) {
      var out = found.get(i).value().assemble(input, level.registryAccess())
      if (out.hasTag('minecraft:planks')) plank = String(out.id)
    }
  } catch (e) {
    console.error(`Chopping block: no plank lookup for ${logId}: ${e}`)
    return null
  }
  paChopPlankCache[logId] = plank
  return plank
}

// Server side: the log a player chops next: from the off-hand, else the first one in the
// inventory (hotbar first). Null if they carry none that makes planks.
function paChopNextLog(player, level) {
  var off = player.getOffhandItem()
  if (off.hasTag('minecraft:logs') && paChopPlanks(level, off.id)) return off
  var inv = player.getInventory()
  for (var i = 0; i < 36; i++) {
    var stack = inv.getItem(i)
    if (stack.hasTag('minecraft:logs') && paChopPlanks(level, stack.id)) return stack
  }
  return null
}

// Which look the loaded block gets (global.PA_CHOP_WOODS, age0_items.js).
function paChopWood(logId) {
  var name = String(logId).replace(/^minecraft:/, '').replace(/^stripped_/, '').replace(/_(log|wood|stem|hyphae)$/, '')
  return global.PA_CHOP_WOODS.indexOf(name) >= 0 ? name : 'other'
}

// Server side: sets a log from this stack on an empty block. False if it makes no planks.
function paChopLoad(player, level, pos, stack) {
  var server = player.getServer()
  var logId = String(stack.id)
  if (!paChopPlanks(level, logId)) {
    player.setStatusMessage(Text.gold("That log can't be split into planks."))
    return false
  }
  paChopLogs(server).putString(paChopKey(level, pos), logId)
  level.getBlock(pos).set(`kubejs:chopping_block_${paChopWood(logId)}`)
  if (!player.isCreative()) stack.shrink(1)
  server.runCommandSilent(`playsound minecraft:block.wood.place block @a ${pos.getX()} ${pos.getY()} ${pos.getZ()}`)
  return true
}

// Server side: the log is split. Two planks into the inventory, the axe wears.
function paChopFinish(player, level, pos) {
  var block = level.getBlock(pos)
  if (!String(block.id).startsWith('kubejs:chopping_block_')) return
  var logs = paChopLogs(player.getServer())
  var key = paChopKey(level, pos)
  var log = logs.contains(key) ? String(logs.getString(key)) : 'minecraft:oak_log'
  logs.remove(key)
  var logBlock = $PaChopRegistry.BLOCK.get($PaChopRL.parse(log))
  block.set('kubejs:chopping_block')
  player.give(Item.of(paChopPlanks(level, log) || 'minecraft:oak_planks', 2))
  player.damageHeldItem($PaChopHand.MAIN_HAND, 1)
  level.levelEvent(2001, pos, $PaChopBlock.getId(logBlock.defaultBlockState())) // the log's break sound and chips
}

// Server side, once per tick while a player holds an axe on a loaded block.
function paChopTick(event, player) {
  var at = event.getPosition()
  if (!at.isPresent()) return
  var pos = at.get()
  var server = player.getServer()
  var now = server.getTickCount()
  var key = `${player.getId()}|${pos.asLong()}`
  var chop = paChops[key]
  if (!chop || now - chop.tick > 2) {
    // A fresh chop (or the player let go). The cracks use an id of their own, so the
    // chopping player sees them too (the game never sends a player their own id's cracks).
    chop = { progress: 0, stage: -1, tick: now, last: -1, pos: pos, level: player.level, crack: -1000 - player.getId() }
    paChops[key] = chop
  }
  if (chop.last == now) return // counted this tick already
  chop.last = now
  chop.tick = now
  chop.progress += event.getOriginalSpeed() / PA_CHOP_EFFORT / 30
  var stage = Math.min(9, Math.floor(chop.progress * 10))
  if (stage != chop.stage) {
    chop.stage = stage
    chop.level.destroyBlockProgress(chop.crack, pos, stage)
  }
  if (chop.progress < 1) {
    paChopWatch(server, key)
    return
  }
  delete paChops[key]
  chop.level.destroyBlockProgress(chop.crack, pos, -1)
  paChopFinish(player, chop.level, pos)
}

// Clears the cracks if the player stops chopping before the log splits.
function paChopWatch(server, key) {
  var chop = paChops[key]
  if (!chop || chop.watching) return
  chop.watching = true
  server.scheduleInTicks(5, () => {
    chop.watching = false
    if (paChops[key] !== chop) return
    if (server.getTickCount() - chop.tick > 2) {
      delete paChops[key]
      chop.level.destroyBlockProgress(chop.crack, chop.pos, -1)
    } else {
      paChopWatch(server, key)
    }
  })
}

NativeEvents.onEvent($PaChopBreakSpeed, event => {
  var id = paChopBlockId(event.getState())
  if (!id.startsWith('kubejs:chopping_block')) return
  var player = event.getEntity()
  if (player.isCreative()) return
  var axe = player.getMainHandItem().hasTag('minecraft:axes')
  if (id == 'kubejs:chopping_block') {
    if (!axe) return
    event.setNewSpeed(0)
    // Set the next log the player carries on the block (the server only).
    var at = event.getPosition()
    if (!player.getServer() || !at.isPresent()) return
    var log = paChopNextLog(player, player.level)
    if (log) paChopLoad(player, player.level, at.get(), log)
    return
  }
  event.setNewSpeed(0)
  if (axe && player.getServer()) paChopTick(event, player)
})

NativeEvents.onEvent($PaChopRightClick, event => {
  var player = event.getEntity()
  var level = event.getLevel()
  var pos = event.getPos()
  var id = paChopBlockId(level.getBlockState(pos))
  if (!id.startsWith('kubejs:chopping_block')) return
  var main = String(event.getHand()) == 'MAIN_HAND'
  var held = main ? player.getMainHandItem() : player.getOffhandItem()
  var server = player.getServer()
  if (held.hasTag('minecraft:logs')) {
    // A log in either hand goes onto an empty block, and is never placed against one.
    event.setCanceled(true)
    event.setCancellationResult($PaChopResult.SUCCESS)
    if (!server) return // the player's game: wait for the server
    if (id == 'kubejs:chopping_block') paChopLoad(player, level, pos, held)
    return
  }
  if (!main) return
  if (id != 'kubejs:chopping_block' && held.isEmpty()) {
    event.setCanceled(true)
    event.setCancellationResult($PaChopResult.SUCCESS)
    if (!server) return
    var logs = paChopLogs(server)
    var key = paChopKey(level, pos)
    player.give(logs.contains(key) ? String(logs.getString(key)) : 'minecraft:oak_log')
    logs.remove(key)
    level.getBlock(pos).set('kubejs:chopping_block')
  } else if (id == 'kubejs:chopping_block' && server && !player.getOffhandItem().hasTag('minecraft:logs')) {
    // (Logs in the off-hand: the off-hand's own click sets one on the block.)
    player.setStatusMessage(Text.gold(paChopNextLog(player, level) ? 'Hold left-click on it with a hatchet.' : 'You need logs to chop.'))
  }
})

// Hints when hitting one, on the server.
NativeEvents.onEvent($PaChopLeftClick, event => {
  var player = event.getEntity()
  if (!player.getServer() || player.isCreative() || String(event.getAction()) != 'START') return
  var id = paChopBlockId(event.getLevel().getBlockState(event.getPos()))
  if (!id.startsWith('kubejs:chopping_block')) return
  var axe = player.getMainHandItem().hasTag('minecraft:axes')
  if (id == 'kubejs:chopping_block' && axe && !paChopNextLog(player, event.getLevel())) {
    player.setStatusMessage(Text.gold('You need logs to chop.'))
  } else if (id != 'kubejs:chopping_block' && !axe) {
    player.setStatusMessage(Text.red('You need a hatchet to chop wood.'))
  }
})

// Something that does break a loaded block (a creative player): the stump stays.
// (Machines and explosions break blocks as fake players, and a big bomb breaks thousands a tick,
// so those are let through before anything else is looked up.)
NativeEvents.onEvent($PaChopBreak, event => {
  var player = event.getPlayer()
  if (!player || player.isFake() || !player.getServer()) return
  var id = paChopBlockId(event.getState())
  if (!id.startsWith('kubejs:chopping_block_')) return
  var level = player.level
  paChopLogs(level.getServer()).remove(paChopKey(level, event.getPos()))
  level.getBlock(event.getPos()).set('kubejs:chopping_block')
  event.setCanceled(true)
})
