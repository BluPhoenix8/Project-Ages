// The Chronicle of Ages: the pack's lore book (Patchouli). The book is plain files in
// patchouli_books/chronicle, written by tools/scripts/gen_chronicle.py.
// - Every player gets one, once: new players when they first join, existing players on
//   their next login.
// - Each age's chapter opens when the player reaches that age. The book's entries wait for
//   hidden advancements (data/projectages/advancement/chronicle, also from gen_chronicle.py),
//   granted here; the last page opens when the player forges the Heart of the Ages.
// - Lost it? A book and a flint shard make a new one (book + flint is the Aether's Book of Lore).

const PA_CHRONICLE_ID = 'patchouli:chronicle'
// Chapter (its advancement's name) -> what the chat line calls it.
const PA_CHRONICLE_CHAPTERS = [
  ['age_1', 'Age I: Bronze'],
  ['age_2', 'Age II: Medieval and Ritual'],
  ['age_3', 'Age III: The Twilight'],
  ['age_4', 'Age IV: Steam'],
  ['age_5', 'Age V: Industry'],
  ['age_6', 'Age VI: Advanced Tech'],
  ['age_7', 'Age VII: Space'],
  ['heart', 'The Last Page']
]
const $PaPatchouliApi = Java.loadClass('vazkii.patchouli.api.PatchouliAPI')
const $PaChronicleRL = Java.loadClass('net.minecraft.resources.ResourceLocation')

function paChronicleBook() {
  return $PaPatchouliApi.get().getBookStack($PaChronicleRL.parse(PA_CHRONICLE_ID))
}

function paChronicleReached(player, chapter) {
  if (chapter == 'heart') return player.persistentData.getInt('pa_heart_serial') > 0 // heart.js
  return AStages.playerHasStage(player, chapter)
}

// Opens every chapter the player has reached but hasn't been given yet.
function paChronicleSync(player) {
  var pd = player.persistentData
  var opened = []
  PA_CHRONICLE_CHAPTERS.forEach(chapter => {
    var flag = `pa_chronicle_${chapter[0]}`
    if (pd.getBoolean(flag) || !paChronicleReached(player, chapter[0])) return
    pd.putBoolean(flag, true)
    player.server.runCommandSilent(`advancement grant ${player.username} only projectages:chronicle/${chapter[0]}`)
    opened.push(chapter[1])
  })
  if (opened.length) {
    player.tell(Text.gold(`The Chronicle of Ages: a new chapter opens (${opened.join(', ')}).`))
  }
}

// Closes the chapters past an age again (the tester's /pa age and /pa reset).
function paChronicleReset(player, age) {
  var pd = player.persistentData
  PA_CHRONICLE_CHAPTERS.forEach((chapter, i) => {
    if (i + 1 <= age && chapter[0] != 'heart') return
    pd.remove(`pa_chronicle_${chapter[0]}`)
    player.server.runCommandSilent(`advancement revoke ${player.username} only projectages:chronicle/${chapter[0]}`)
  })
}

// Every player gets the book once. (Until 0.4.19 the first-join sweep in first_join.js cleared
// it straight away; players without one get it on their next login, players who have one
// don't get a second.) first_join.js gives brand-new players theirs after its sweep.
function paHasChronicle(player) {
  var inv = player.getInventory()
  for (var i = 0; i < inv.getContainerSize(); i++) {
    if (String(inv.getItem(i).id) == 'patchouli:guide_book') return true
  }
  return false
}

PlayerEvents.loggedIn(event => {
  var player = event.player
  var pd = player.persistentData
  if (!pd.getBoolean('pa_chronicle_given_v2')) {
    pd.putBoolean('pa_chronicle_given_v2', true)
    // First joins are handled by first_join.js (it clears the inventory a second later).
    if (pd.getBoolean('project_ages_starter_given') && !paHasChronicle(player)) player.give(paChronicleBook())
  }
  paChronicleSync(player)
})

PlayerEvents.tick(event => {
  if (event.player.tickCount % 100 == 0) paChronicleSync(event.player)
})

ServerEvents.recipes(event => {
  event.shapeless(paChronicleBook(), ['minecraft:book', 'kubejs:flint_shard']).id('kubejs:chronicle_of_ages')
})
