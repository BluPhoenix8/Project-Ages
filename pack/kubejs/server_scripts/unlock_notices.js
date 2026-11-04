// One-off chat notices for unlocks that have no item of their own to discover.
// Each is shown once per player (flag in persistentData), the first time they have the stage.

const PA_UNLOCK_NOTICES = [
  {
    stage: 'age_4',
    flag: 'pa_told_ultimine',
    lines: [
      Text.gold('Vein mining unlocked! (FTB Ultimine)'),
      Text.gray('Hold the Ultimine key (default: the ` key, left of 1) while mining to break a whole ore'),
      Text.gray('vein or connected blocks at once. Change the key in Options > Controls.')
    ]
  }
]

PlayerEvents.tick(event => {
  const player = event.player
  if (player.tickCount % 40 != 0) return
  PA_UNLOCK_NOTICES.forEach(n => {
    if (player.persistentData.getBoolean(n.flag) || !AStages.playerHasStage(player, n.stage)) return
    player.persistentData.putBoolean(n.flag, true)
    n.lines.forEach(line => player.tell(line))
    player.server.runCommandSilent(`playsound minecraft:entity.player.levelup master ${player.username} ~ ~ ~ 0.7 1.2`)
  })
})
