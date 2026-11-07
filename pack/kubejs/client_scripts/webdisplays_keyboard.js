// WebDisplays (the 1.21.1 fork, 2.6.0) crashes the game when its Keyboard window opens for a web
// screen this computer doesn't have (owner, 2026-11-05: a screen wall rebuilt three times while
// making it bigger, then the Keyboard clicked; "Ticking screen" crash in GuiKeyboard). The window reads its screen without
// checking, when it opens, every tick after that, and when it closes.
// So this checks first. When the Keyboard's screen is missing here, the window doesn't open and the
// server sends that screen again (server_scripts/webdisplays_keyboard.js); the next click works.
// A window whose screen goes away while it's open is closed. If WebDisplays' names ever change, this
// says so in the log once and does nothing.

var paKb = null
try {
  paKb = {
    Gui: Java.loadClass('net.montoyo.wd.client.gui.GuiKeyboard'),
    WDScreen: Java.loadClass('net.montoyo.wd.client.gui.WDScreen'),
    Camera: Java.loadClass('net.montoyo.wd.client.gui.camera.KeyboardCamera'),
    Mod: Java.loadClass('net.montoyo.wd.WebDisplays'),
    ScreenTile: Java.loadClass('net.montoyo.wd.entity.ScreenBlockEntity'),
    BlockPos: Java.loadClass('net.minecraft.core.BlockPos'),
    sides: Java.loadClass('net.montoyo.wd.utilities.data.BlockSide').values(),
    ready: null, // the Keyboard window that last opened all the way
    lastAsk: 0
  }
  NativeEvents.onEvent(Java.loadClass('net.neoforged.neoforge.client.event.ScreenEvent$Opening'), paKbOpening)
  NativeEvents.onEvent(Java.loadClass('net.neoforged.neoforge.client.event.ScreenEvent$Init$Post'), paKbOpened)
  NativeEvents.onEvent(Java.loadClass('net.neoforged.neoforge.client.event.ClientTickEvent$Pre'), paKbTick)
} catch (e) {
  paKbOff(e)
}

function paKbOff(e) {
  console.warn(`WebDisplays keyboard guard is off: ${e}`)
  paKb = null
}

// Which screen a Keyboard window is for. The window keeps that to itself; isForBlock() is the only
// way to ask, so every screen this computer knows is tried. Null when none matches (or the window
// has no screen at all, which isForBlock() can't answer).
function paKbTarget(gui) {
  return paKbMatch(gui, paKb.Mod.PROXY.getScreens())
}

// The same, through every screen block in the chunks around the player: a screen placed this very
// tick isn't on WebDisplays' list yet.
function paKbTargetNearby(gui) {
  var tiles = []
  var here = Client.player.chunkPosition()
  for (var dx = -4; dx <= 4; dx++) {
    for (var dz = -4; dz <= 4; dz++) {
      var chunk = Client.level.getChunkSource().getChunk(here.x + dx, here.z + dz, false)
      if (chunk == null) continue
      var found = chunk.getBlockEntities().values().iterator()
      while (found.hasNext()) {
        var tile = found.next()
        if (tile instanceof paKb.ScreenTile) tiles.push(tile)
      }
    }
  }
  return paKbMatch(gui, tiles)
}

function paKbMatch(gui, tiles) {
  var count = Array.isArray(tiles) ? tiles.length : tiles.size()
  for (var i = 0; i < count; i++) {
    var tile = Array.isArray(tiles) ? tiles[i] : tiles.get(i)
    for (var j = 0; j < paKb.sides.length; j++) {
      try {
        if (gui.isForBlock(tile.getBlockPos(), paKb.sides[j])) return { tile: tile, side: paKb.sides[j] }
      } catch (e) {
        return null
      }
    }
  }
  return null
}

// Asks the server for the screen at pos again, at most once a second.
function paKbReload(pos) {
  var now = Date.now()
  if (now - paKb.lastAsk < 1000) return
  paKb.lastAsk = now
  Client.player.sendData('pa_webscreen', { x: pos.getX(), y: pos.getY(), z: pos.getZ() })
  Client.player.setStatusMessage(Text.gray('Screen reloaded: use the keyboard again'))
}

function paKbOpening(event) {
  if (paKb == null) return
  try {
    var gui = event.getNewScreen()
    if (!(gui instanceof paKb.Gui)) return
    var target = paKbTarget(gui) || paKbTargetNearby(gui)
    if (target == null) {
      event.setCanceled(true) // no screen here for it at all: opening it would crash
      Client.player.setStatusMessage(Text.gray("The keyboard can't find its screen"))
      return
    }
    var screen = target.tile.getScreen(target.side)
    if (screen != null && screen.browser == null) {
      target.tile.activate() // screens switch off from far away; the window needs this one on
      screen = target.tile.getScreen(target.side)
    }
    if (screen != null && screen.browser != null) return
    event.setCanceled(true)
    paKbReload(target.tile.getBlockPos())
  } catch (e) {
    paKbOff(e)
  }
}

function paKbOpened(event) {
  if (paKb == null) return
  try {
    if (event.getScreen() instanceof paKb.Gui) paKb.ready = event.getScreen()
  } catch (e) {
    paKbOff(e)
  }
}

// Runs before the open window's own tick, which is where the crash happened.
function paKbTick(event) {
  if (paKb == null) return
  try {
    var gui = Client.screen
    if (!(gui instanceof paKb.Gui)) {
      paKb.ready = null
      return
    }
    var target = paKbTarget(gui)
    if (gui === paKb.ready) {
      if (target != null && target.tile.getScreen(target.side) != null) return
      gui.onClose() // its screen went away while open; its own close still works here
      Client.player.setStatusMessage(Text.gray('The keyboard lost its screen'))
      return
    }
    // It stopped half way through opening because its screen was missing, and its own close
    // would crash the same way. Let go of it without that.
    paKb.Camera.focus(null, null)
    if (paKb.WDScreen.CURRENT_SCREEN === gui) paKb.WDScreen.CURRENT_SCREEN = null
    Client.screen = null
    Client.mouseHandler.grabMouse()
    if (target != null) paKbReload(target.tile.getBlockPos())
  } catch (e) {
    paKbOff(e)
  }
}

// The screen the server sent back: loaded the same way as when its chunk arrives.
NetworkEvents.dataReceived('pa_webscreen', event => {
  if (paKb == null) return
  try {
    var data = event.data
    var tile = Client.level.getBlockEntity(new paKb.BlockPos(data.getInt('x'), data.getInt('y'), data.getInt('z')))
    if (tile instanceof paKb.ScreenTile) tile.handleUpdateTag(data.getCompound('tile'), Client.level.registryAccess())
  } catch (e) {
    paKbOff(e)
  }
})
