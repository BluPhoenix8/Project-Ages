// Architectury (the networking library under the FTB mods, Meadow, Farm & Charm and others) keeps every
// mod's network messages in plain HashMaps, which mods fill from several threads at once while the game
// starts, so entries get lost. A lost "server to player" codec breaks whatever sends that message:
// FTB Ultimine's block outline kicked the player (0.4.41, creative test server); in 0.7.0 test 5 /pa age
// failed with "codec is null" (an FTB Quests message, already gone before the server finished starting).
// So, when the server has started:
// - every codec that's missing is rebuilt: from the mod's own message class (network_codecs.js, made by
//   tools/scripts/gen_net_codecs.py) or, for messages registered by name, the way Architectury makes them;
// - a copy of the maps is kept, and anything that goes missing later is put back (checked every tick
//   when a map shrinks, and in full once a second; new entries join the copy).

const $PaNetMaps = Java.loadClass('dev.architectury.impl.NetworkAggregator')
const $PaNetBuf = Java.loadClass('dev.architectury.impl.NetworkAggregator$BufCustomPacketPayload')
const $PaNetTransformer = Java.loadClass('dev.architectury.networking.transformers.PacketTransformer')
const $PaNetHashMap = Java.loadClass('java.util.HashMap')
const $PaNetList = Java.loadClass('java.util.ArrayList')
const PA_NET_MAPS = ['C2S_TYPE', 'S2C_TYPE', 'C2S_RECEIVER', 'S2C_RECEIVER', 'C2S_CODECS', 'S2C_CODECS', 'C2S_TRANSFORMERS', 'S2C_TRANSFORMERS']
var paNetCopy = null

// Rebuild missing server-to-player codecs; returns the ids it put back.
function paNetRebuild() {
  var codecs = $PaNetMaps.S2C_CODECS
  var transformers = $PaNetMaps.S2C_TRANSFORMERS
  var fixed = []
  var messages = typeof PA_NET_MESSAGES == 'undefined' ? [] : PA_NET_MESSAGES
  messages.forEach(m => {
    try {
      var cls = Java.loadClass(m[0])
      var id = cls[m[1]].id()
      if (codecs.containsKey(id)) return
      // a player-to-server message: the server has it in C2S and never sends it
      if ($PaNetMaps.C2S_CODECS.containsKey(id) && !transformers.containsKey(id)) return
      codecs.put(id, cls[m[2]])
      if (!transformers.containsKey(id)) transformers.put(id, $PaNetTransformer.concat(new $PaNetList()))
      fixed.push(String(id))
    } catch (e) { }
  })
  // registered by name: Architectury's own codec for that type
  new $PaNetHashMap($PaNetMaps.S2C_TYPE).forEach((id, type) => {
    if (codecs.containsKey(id)) return
    try {
      codecs.put(id, $PaNetBuf.streamCodec(type))
      if (!transformers.containsKey(id)) transformers.put(id, $PaNetTransformer.concat(new $PaNetList()))
      fixed.push(String(id))
    } catch (e) { }
  })
  return fixed
}

// Put back what went missing since the copy, and add new entries to it; returns how many it put back.
function paNetRestore() {
  var restored = 0
  PA_NET_MAPS.forEach(name => {
    var live = $PaNetMaps[name]
    var copy = paNetCopy[name]
    copy.forEach((key, value) => {
      if (!live.containsKey(key)) {
        live.put(key, value)
        restored++
        console.warn(`Network: put back ${name} ${key}, which had gone missing`)
      }
    })
    if (live.size() > copy.size()) copy.putAll(live)
  })
  return restored
}

ServerEvents.loaded(event => {
  try {
    var fixed = paNetRebuild()
    if (fixed.length) console.warn(`Network: ${fixed.length} codecs were missing at start, rebuilt: ${fixed.join(', ')}`)
    paNetCopy = {}
    PA_NET_MAPS.forEach(name => { paNetCopy[name] = new $PaNetHashMap($PaNetMaps[name]) })
  } catch (e) {
    console.error(`Network guard is off: ${e}`)
    paNetCopy = null
  }
})

ServerEvents.tick(event => {
  if (!paNetCopy) return
  try {
    var shrank = PA_NET_MAPS.some(name => $PaNetMaps[name].size() < paNetCopy[name].size())
    if (shrank || event.server.tickCount % 20 == 0) paNetRestore()
  } catch (e) { }
})
