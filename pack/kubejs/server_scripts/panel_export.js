// Dedicated servers: every 2 seconds, write kubejs/exports/panel-status.json for the server
// panel (tools/panel): who is online, where, their age, and how fast the server is running.
// (Memory comes from the server's GC log, which the panel reads itself: KubeJS can't see it.)

function paPanelAge(player) {
  let age = 0
  global.AGES.forEach((a, i) => { if (AStages.playerHasStage(player, a.stage)) age = i + 1 })
  return age
}

ServerEvents.tick(event => {
  const server = event.server
  if (server.tickCount % 40 != 0 || Platform.isClientEnvironment()) return
  const out = { time: Date.now(), players: [] }
  let mspt = -1 // declared outside try: Rhino rejects declarations inside try here
  try { mspt = Number(server.getAverageTickTimeNanos()) / 1e6 } catch (e) { }
  if (mspt >= 0) {
    out.mspt = Math.round(mspt * 10) / 10
    out.tps = Math.round(Math.min(20, 1000 / Math.max(mspt, 1)) * 10) / 10
  }
  server.players.forEach(p => {
    // KubeJS names it stringUuid: getStringUUID() isn't found, and that once failed the whole update
    const info = { name: String(p.username) }
    try { info.uuid = String(p.stringUuid) } catch (e) { }
    if (!info.uuid || info.uuid == 'undefined') try { info.uuid = String(p.uuid) } catch (e) { }
    try { if (p.level.dimension) info.dim = String(p.level.dimension) } catch (e) { }
    try { info.x = Math.round(p.x); info.y = Math.round(p.y); info.z = Math.round(p.z) } catch (e) { }
    try { info.ping = Number(p.connection.latency()) } catch (e) { }
    try { info.age = paPanelAge(p) } catch (e) { }
    try { info.op = server.playerList.isOp(p.gameProfile) == true } catch (e) { }
    out.players.push(info)
  })
  JsonIO.write('kubejs/exports/panel-status.json', JsonIO.parseRaw(JSON.stringify(out)))
})

// /pa spawn <players>: the panel's "Teleport to spawn" button.
ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event
  event.register(Commands.literal('pa')
    .requires(source => source.hasPermission(2))
    .then(Commands.literal('spawn').then(Commands.argument('players', Arguments.PLAYERS.create(event)).executes(ctx => {
      const level = ctx.source.server.overworld()
      const pos = level.getSharedSpawnPos()
      Arguments.PLAYERS.getResult(ctx, 'players').forEach(p => p.teleportTo(level, pos.x + 0.5, pos.y, pos.z + 0.5, p.yRot, p.xRot))
      return 1
    }))))
})
