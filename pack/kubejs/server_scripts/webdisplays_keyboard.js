// The server half of client_scripts/webdisplays_keyboard.js. A player whose game is missing a web
// screen (its Keyboard window would have crashed the game) asks for that screen here and gets it
// back, the same data the game gets when the screen's chunk loads. Only screens near the player, at
// most once a second per player.

const $PaScreenTile = Java.loadClass('net.montoyo.wd.entity.ScreenBlockEntity')
const $PaScreenPos = Java.loadClass('net.minecraft.core.BlockPos')
const paScreenAsked = {}

NetworkEvents.dataReceived('pa_webscreen', event => {
  const player = event.player
  const key = String(player.uuid)
  const now = Date.now()
  if (paScreenAsked[key] && now - paScreenAsked[key] < 1000) return
  paScreenAsked[key] = now

  const data = event.data
  const pos = new $PaScreenPos(data.getInt('x'), data.getInt('y'), data.getInt('z'))
  if (player.blockPosition().distSqr(pos) > 128 * 128) return
  const level = player.level
  if (!level.isLoaded(pos)) return
  const tile = level.getBlockEntity(pos)
  if (!(tile instanceof $PaScreenTile)) return
  player.sendData('pa_webscreen', {
    x: pos.getX(), y: pos.getY(), z: pos.getZ(),
    tile: tile.getUpdateTag(level.registryAccess())
  })
})
