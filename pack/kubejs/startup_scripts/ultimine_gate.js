// FTB Ultimine (vein mining) only works from Age 4 (Steam) on. Ultimine asks every
// registered restriction handler before it mines; this one checks the player's age.
// To move it to another age, change ULTIMINE_STAGE.
//
// Ultimine asks on both sides: the server decides, and the client asks every tick to
// draw the outline. On the client the player is a LocalPlayer, so the stage comes from
// AStages' synced client copy. Any error answers "no" instead of crashing the game.

const ULTIMINE_STAGE = 'age_4'
const $UltimineRestrictions = Java.loadClass('dev.ftb.mods.ftbultimine.RestrictionHandlerRegistry')
const $AStagesUtils = Java.loadClass('com.alessandro.astages.api.util.AStagesUtils')
const $AHolder = Java.loadClass('com.alessandro.astages.api.holder.AHolder')
let $UltimineClientStages = null
let ultimineGateWarned = false

// KubeJS can hand back "level" and "isClientSide" as plain values rather than methods
// (0.4.38 bug report: "level ... is not a function"), so accept either form.
function ultimineOnClient(player) {
  let level = typeof player.level === 'function' ? player.level() : player.level
  let client = level.isClientSide
  return typeof client === 'function' ? client.call(level) : !!client
}

function ultimineAllowed(player) {
  if (ultimineOnClient(player)) {
    if ($UltimineClientStages == null) {
      $UltimineClientStages = {
        utils: Java.loadClass('com.alessandro.astages.api.util.AStagesClientUtils'),
        holder: Java.loadClass('com.alessandro.astages.api.holder.AClientHolder')
      }
    }
    return $UltimineClientStages.utils.hasStage($UltimineClientStages.holder.player(), ULTIMINE_STAGE)
  }
  // Not AHolder.player(...): KubeJS has no getUUID() here, and passing the player itself is
  // ambiguous between its two versions. serverAndPlayer (as unfamiliar_items.js uses) has one.
  return $AStagesUtils.hasStage($AHolder.serverAndPlayer(player), ULTIMINE_STAGE)
}

$UltimineRestrictions.INSTANCE.register(player => {
  try {
    return ultimineAllowed(player)
  } catch (e) {
    if (!ultimineGateWarned) {
      ultimineGateWarned = true
      console.error(`Ultimine age check failed, vein mining disabled: ${e}`)
    }
    return false
  }
})
