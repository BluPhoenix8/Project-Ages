// Dedicated servers: once the server has fully stopped (world saved), write
// kubejs/exports/server-stopped.json. The server pack's startserver scripts wait for it and then
// close Java if mods' leftover threads (Distant Horizons) keep a stopped server running.
NativeEvents.onEvent(Java.loadClass('net.neoforged.neoforge.event.server.ServerStoppedEvent'), event => {
  if (Platform.isClientEnvironment()) return // singleplayer: no server pack scripts to tell
  JsonIO.write('kubejs/exports/server-stopped.json', JsonIO.parseRaw('{"stopped": true}'))
})
