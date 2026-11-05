// Ballistix explosions without the lag (owner, 2026-11-04: keep the bombs, but they need optimizing).
// Tested on the dev server: one thermobaric blast finishes in about 6 seconds, but when 16 go off
// together, 15 never finish (a Ballistix bug with blasts working at the same time), and Ballistix keeps
// a blast's chunks loaded until it does. On the creative test server that held the world at 3 TPS. So:
// 1. Blasts take turns. At most PA_BLAST_MAX_ACTIVE work at once on the whole server; the rest wait in
//    line and go off, in order, as soon as one finishes. Every bomb still explodes.
// 2. A blast still working after PA_BLAST_STUCK_SECONDS of real time is ended, so a stuck (or huge)
//    one can't lag a server for long. Real time, not ticks: under heavy lag, 2 minutes of ticks can
//    take hours. Gas clouds and other blasts that linger on purpose (Ballistix's "persisting" phase)
//    don't hold the turn while they linger, and get PA_BLAST_MAX_AGE_SECONDS.

const PA_BLAST = 'ballistix:blast'
const PA_BLAST_MAX_ACTIVE = 1
const PA_BLAST_STUCK_SECONDS = 120     // a thermobaric blast takes about 10 seconds
const PA_BLAST_MAX_AGE_SECONDS = 1800  // 30 minutes, for lingering blasts
const PA_BLAST_WAIT_TEXT = 'Blast waiting: others still exploding'

// The blasts going off, as {entity, since, lingering}, and the line of waiting ones, as {level, nbt}.
// Waiting blasts live in memory only: a server restart drops the line.
var paBlastActive = []
var paBlastWaiting = []
var paBlastReleasing = false

function paBlastAlive() {
  paBlastActive = paBlastActive.filter(b => !b.entity.isRemoved())
  return paBlastActive
}

function paBlastBusy() {
  return paBlastAlive().filter(b => !b.lingering).length
}

function paBlastWhere(nbt) {
  var pos = nbt.getList('Pos', 6)
  return `${Math.round(pos.getDouble(0))} ${Math.round(pos.getDouble(1))} ${Math.round(pos.getDouble(2))}`
}

EntityEvents.spawned(PA_BLAST, event => {
  var level = event.level
  var entity = event.entity
  if (!paBlastReleasing && paBlastBusy() >= PA_BLAST_MAX_ACTIVE) {
    var nbt = entity.nbt
    nbt.remove('UUID')
    paBlastWaiting.push({ level: level, nbt: nbt })
    console.info(`Ballistix: ${nbt.getString('type')} at ${paBlastWhere(nbt)} in ${level.dimension} waits its turn (${paBlastWaiting.length} waiting)`)
    level.server.players.forEach(p => {
      if (p.level == level && p.distanceToSqr(entity) < 96 * 96) p.displayClientMessage(Text.yellow(PA_BLAST_WAIT_TEXT), true)
    })
    event.cancel()
    return
  }
  paBlastAlive().push({ entity: entity, since: Date.now(), lingering: false })
})

ServerEvents.tick(event => {
  if (event.server.tickCount % 10 != 0) return
  var now = Date.now()
  paBlastAlive().forEach(b => {
    var nbt = b.entity.nbt
    b.lingering = nbt.getBoolean('shouldpersist') && nbt.getBoolean('hasmatured')
    var age = (now - b.since) / 1000
    if (age > (b.lingering ? PA_BLAST_MAX_AGE_SECONDS : PA_BLAST_STUCK_SECONDS)) {
      console.warn(`Ballistix: ended a ${nbt.getString('type')} blast at ${paBlastWhere(nbt)} in ${b.entity.level.dimension} after ${Math.round(age)} s`)
      b.entity.kill()
    }
  })
  while (paBlastWaiting.length && paBlastBusy() < PA_BLAST_MAX_ACTIVE) {
    var next = paBlastWaiting.shift()
    var blast = next.level.createEntity(PA_BLAST)
    blast.load(next.nbt)
    paBlastReleasing = true
    try {
      blast.spawn()
    } finally {
      paBlastReleasing = false
    }
  }
})
