// Bosses & Glory side chapter: a boss kill credits everyone nearby, not just whoever landed
// the last hit, so friends who fight together all progress. Each boss gives a stage that its
// quest checks (FTB Quests stage task).

const BOSS_STAGES = {
  'minecraft:elder_guardian': 'boss_elder_guardian',
  'minecraft:wither': 'boss_wither',
  'minecraft:warden': 'boss_warden',
  'minecraft:ender_dragon': 'boss_dragon',
  'cataclysm:ignis': 'boss_ignis',
  'cataclysm:netherite_monstrosity': 'boss_monstrosity',
  'cataclysm:the_harbinger': 'boss_harbinger',
  'cataclysm:ancient_remnant': 'boss_remnant',
  'cataclysm:the_leviathan': 'boss_leviathan',
  'cataclysm:maledictus': 'boss_maledictus',
  'cataclysm:scylla': 'boss_scylla',
  'cataclysm:ender_guardian': 'boss_ender_guardian'
}
const BOSS_CREDIT_RANGE = 128 // the dragon fight spreads out

EntityEvents.death(event => {
  const entity = event.entity
  const type = String(entity.type)
  const stage = BOSS_STAGES[type]
  if (!stage) return
  const dim = String(entity.level.dimension)
  let credited = 0
  // Plain numbers: distanceTo(entity) is ambiguous to KubeJS (it has an Entity and a Vec3 version) and threw
  // on every boss death, so no boss quest ever completed (owner, 2026-11-07: the Ender Dragon didn't count).
  const ex = entity.getX(), ey = entity.getY(), ez = entity.getZ()
  const range2 = BOSS_CREDIT_RANGE * BOSS_CREDIT_RANGE
  event.server.players.forEach(p => {
    const dx = p.getX() - ex, dy = p.getY() - ey, dz = p.getZ() - ez
    if (String(p.level.dimension) != dim || dx * dx + dy * dy + dz * dz > range2) return
    credited++
    if (p.stages.has(stage)) return
    p.stages.add(stage)
    p.tell(Text.gold(`${entity.displayName.getString()} defeated!`))
  })
  console.info(`Boss ${type} died; ${credited} player(s) credited`)
})
