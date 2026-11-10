// The ages live in AStages, but FTB Quests' stage tasks read KubeJS's own stage list (where the bronze tools
// and boss stages go). Each age's opening quest completes on a stage task for that age (0.7.0: the side
// chapters and age-gated quests open from it), so every player's ages are copied into KubeJS's list:
// at login and every 2 seconds, added and taken away to match (owner, 0.7.0 test 4: at Age I the Kitchen and
// Hearth and Home never opened, because "Age I: Bronze" never completed).

const PA_MIRRORED_AGES = ['age_1', 'age_2', 'age_3', 'age_4', 'age_5', 'age_6', 'age_7']

// how many stages it changed. `stages` is the player's own list unless given (the self-test passes one:
// KubeJS gives fake players an empty list that never changes)
function paMirrorAges(player, stages) {
  var list = stages || player.stages
  var changed = 0
  PA_MIRRORED_AGES.forEach(stage => {
    var has = AStages.playerHasStage(player, stage)
    if (has && !list.has(stage)) { list.add(stage); changed++ }
    else if (!has && list.has(stage)) { list.remove(stage); changed++ }
  })
  return changed
}

PlayerEvents.loggedIn(event => {
  try { paMirrorAges(event.player) } catch (err) { console.error('Age mirror: ' + err) }
})

PlayerEvents.tick(event => {
  if (event.player.tickCount % 40 != 0) return
  try { paMirrorAges(event.player) } catch (err) { }
})
