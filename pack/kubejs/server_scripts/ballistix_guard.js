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
// 0.5.0 test 8 (owner, nukes on the Test Server's creative world, 10-20 s behind for minutes):
// 3. A blast that lands on claimed land does nothing there. Ballistix asks every mod's block rules about
//    every block a blast covers, and a block the claim refuses stays on its list, so a nuke on a claim
//    asked about the same 2,400 blocks every other tick until it was ended, and it still killed people
//    and left radiation. FTB Chunks' "Allow Explosion Damage" lets bombs through on that team's land,
//    and an open war zone (0.7.0) can too: see paBlastZoneOpen.
// 4. A waiting blast keeps its own entity and goes off as that entity. A Ballistix missile stays in the
//    ground until that exact blast starts or is gone, so firing a copy left the missile standing for good.
// 5. Blasts are ended with discard(), never kill(): Ballistix frees a blast's chunk only when it's
//    discarded, and saves the hold across restarts, so a killed blast kept its chunk loaded and ticking
//    forever. paBlastFreeChunks lets go of any such hold when the server starts.

const PA_BLAST = 'ballistix:blast'
const PA_BLAST_MAX_ACTIVE = 1
const PA_BLAST_STUCK_SECONDS = 120     // a thermobaric blast takes about 10 seconds
const PA_BLAST_MAX_AGE_SECONDS = 1800  // 30 minutes, for lingering blasts
const PA_BLAST_WAIT_TEXT = 'Blast waiting: others still exploding'
const PA_BLAST_CLAIM_TEXT = 'Claimed land: the bomb fizzles'
const PA_BLAST_TICKETS = 'ballistix:blastcontroller'

const $PaBlastChunksAPI = Java.loadClass('dev.ftb.mods.ftbchunks.api.FTBChunksAPI')
const $PaBlastChunkDimPos = Java.loadClass('dev.ftb.mods.ftblibrary.math.ChunkDimPos')
const $PaBlastTicketController = Java.loadClass('net.neoforged.neoforge.common.world.chunk.TicketController')
const $PaBlastForcedChunks = Java.loadClass('net.minecraft.world.level.ForcedChunksSavedData')
const $PaBlastCompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag')
const $PaBlastRL = Java.loadClass('net.minecraft.resources.ResourceLocation')
const $PaBlastPos = Java.loadClass('net.minecraft.core.BlockPos')

// The blasts going off, as {entity, since, lingering}, and the line of waiting blast entities.
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

function paBlastWhere(entity) {
  return `${Math.round(entity.x)} ${Math.round(entity.y)} ${Math.round(entity.z)} in ${entity.level.dimension}`
}

function paBlastTell(level, entity, text) {
  level.server.players.forEach(p => {
    if (p.level == level && p.distanceToSqr(entity) < 96 * 96) p.displayClientMessage(Text.yellow(text), true)
  })
}

// Claimed land whose team keeps explosions off. paBlastZoneOpen, where another script defines it
// (0.7.0's war zones), can let a bomb through anyway.
function paBlastOnSafeClaim(level, pos) {
  if (typeof paBlastZoneOpen === 'function' && paBlastZoneOpen(level, pos)) return false
  var chunk = $PaBlastChunksAPI.api().getManager().getChunk(new $PaBlastChunkDimPos(level, pos))
  return chunk != null && !chunk.getTeamData().canExplosionsDamageTerrain()
}

// event.cancel() ends the handler by throwing, so it stays outside try blocks and comes last.
EntityEvents.spawned(PA_BLAST, event => {
  var level = event.level
  var entity = event.entity
  var safe = false
  try {
    safe = paBlastOnSafeClaim(level, entity.blockPosition())
  } catch (err) {
    console.error(`Ballistix: claim check failed, letting the blast go: ${err}`)
  }
  if (safe) {
    console.info(`Ballistix: ${entity.nbt.getString('type')} at ${paBlastWhere(entity)} fizzled on claimed land`)
    paBlastTell(level, entity, PA_BLAST_CLAIM_TEXT)
    entity.discard() // a missile that carried it now counts as gone
    event.cancel()
  }
  if (!paBlastReleasing && paBlastBusy() >= PA_BLAST_MAX_ACTIVE) {
    paBlastWaiting.push(entity)
    console.info(`Ballistix: ${entity.nbt.getString('type')} at ${paBlastWhere(entity)} waits its turn (${paBlastWaiting.length} waiting)`)
    paBlastTell(level, entity, PA_BLAST_WAIT_TEXT)
    event.cancel()
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
      console.warn(`Ballistix: ended a ${nbt.getString('type')} blast at ${paBlastWhere(b.entity)} after ${Math.round(age)} s`)
      b.entity.discard()
    }
  })
  while (paBlastWaiting.length && paBlastBusy() < PA_BLAST_MAX_ACTIVE) {
    var next = paBlastWaiting.shift()
    if (next.isRemoved()) continue
    paBlastReleasing = true
    try {
      next.level.addFreshEntity(next)
    } finally {
      paBlastReleasing = false
    }
  }
})

// Lets go of every chunk Ballistix still holds for a blast. Run at start, before any blast can be
// going off: a blast saved mid-way just takes its chunk back when it loads again.
function paBlastFreeChunks(server) {
  var tickets = new $PaBlastTicketController($PaBlastRL.parse(PA_BLAST_TICKETS))
  var freed = 0
  server.allLevels.forEach(level => {
    var data = level.getDataStorage().get($PaBlastForcedChunks.factory(), 'chunks')
    if (data == null) return
    var held = data['save(net.minecraft.nbt.CompoundTag,net.minecraft.core.HolderLookup$Provider)'](
      new $PaBlastCompoundTag(), server.registryAccess()).getList('ModForced', 10)
    for (var i = 0; i < held.size(); i++) {
      var byController = held.getCompound(i)
      if (byController.getString('Controller') != PA_BLAST_TICKETS) continue
      // A blast always holds its own chunk, so the chunk comes from its saved position (the saved
      // chunk number is a long, which JavaScript can't hold exactly).
      var chunks = byController.getList('ModForced', 10)
      for (var j = 0; j < chunks.size(); j++) {
        var entry = chunks.getCompound(j)
        ;['Blocks', 'TickingBlocks'].forEach(key => {
          var owners = entry.getList(key, 10)
          for (var k = 0; k < owners.size(); k++) {
            var o = owners.getCompound(k)
            var x = o.getInt('X'), z = o.getInt('Z')
            tickets['forceChunk(net.minecraft.server.level.ServerLevel,net.minecraft.core.BlockPos,int,int,boolean,boolean)'](
              level, new $PaBlastPos(x, o.getInt('Y'), z), x >> 4, z >> 4, false, key == 'TickingBlocks')
            freed++
          }
        })
      }
    }
  })
  if (freed) console.warn(`Ballistix: let go of ${freed} chunk hold(s) left by blasts that never finished`)
  return freed
}

ServerEvents.loaded(event => {
  try {
    paBlastFreeChunks(event.server)
  } catch (err) {
    console.error(`Ballistix: couldn't check blast chunk holds: ${err}`)
  }
})
