// Architectury (the networking library under the FTB mods) keeps every mod's network messages in
// plain maps. On the creative test server one entry went missing during a run (FTB Ultimine's block
// outline), so holding the vein-mining key while looking at a block threw an error and kicked the
// player, every time. A fresh start of the same mods had it. This keeps a copy of those maps from when
// the server finished starting and puts back anything that goes missing, checking once a second.
// FTB Ultimine's two server-to-player messages are also checked by name, in case one is already
// missing when the copy is made.

const $PaNetMaps = Java.loadClass('dev.architectury.impl.NetworkAggregator')
const $PaNetHashMap = Java.loadClass('java.util.HashMap')
const PA_NET_MAPS = ['C2S_TYPE', 'S2C_TYPE', 'C2S_RECEIVER', 'S2C_RECEIVER', 'C2S_CODECS', 'S2C_CODECS', 'C2S_TRANSFORMERS', 'S2C_TRANSFORMERS']
const PA_NET_ULTIMINE = ['dev.ftb.mods.ftbultimine.net.SendShapePacket', 'dev.ftb.mods.ftbultimine.net.SyncUltimineTimePacket']
var paNetCopy = null

ServerEvents.loaded(event => {
  try {
    PA_NET_ULTIMINE.forEach(name => {
      var packet = Java.loadClass(name)
      var id = packet.TYPE.id()
      if (!$PaNetMaps.S2C_CODECS.containsKey(id)) {
        $PaNetMaps.S2C_CODECS.put(id, packet.STREAM_CODEC)
        console.warn(`Network: FTB Ultimine's ${id} was missing at start; put back`)
      }
    })
    paNetCopy = {}
    PA_NET_MAPS.forEach(name => { paNetCopy[name] = new $PaNetHashMap($PaNetMaps[name]) })
  } catch (e) {
    console.error(`Network guard is off: ${e}`)
    paNetCopy = null
  }
})

ServerEvents.tick(event => {
  if (!paNetCopy || event.server.tickCount % 20 != 0) return
  PA_NET_MAPS.forEach(name => {
    var live = $PaNetMaps[name]
    paNetCopy[name].forEach((key, value) => {
      if (!live.containsKey(key)) {
        live.put(key, value)
        console.warn(`Network: put back ${name} ${key}, which had gone missing`)
      }
    })
  })
})
