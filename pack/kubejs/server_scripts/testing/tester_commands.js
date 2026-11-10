// Tester commands (server operators only), for checking an age without playing up to it.
//
//   /pa start <age> [players]   jump to the start of an age: set the age and give what a
//                               player would carry on arriving there (arrival kit)
//   /pa age <age> [players]     set exactly that age (adds earlier ages, removes later ones)
//   /pa kit <age> [players]     give everything needed to finish that age's quests (also
//                               raises the player to that age and marks earlier ages done)
//   /pa sidekit <chapter>       the same for a Side Paths chapter (survival, kitchen, magic,
//                               workshop, automation, glory), warfare or space
//   /pa go <place>              teleport to a dimension (twilight, aether, nether, end, moon, mars...),
//                               for quests that ask you to get there; kits link to it in chat
//   /pa find <structure>        go to the dimension a quest's structure is in and locate the nearest one
//   /pa status [players]        show which ages a player has
//   /pa dump                    write recipe + progression data for tools/scripts/audit.py
//
// Ages are 0-7. Combine with vanilla `/tick sprint 6000` to fast-forward crops and machines.

const $BuiltInRegistries = Java.loadClass('net.minecraft.core.registries.BuiltInRegistries')
const $FakePlayerFactory = Java.loadClass('net.neoforged.neoforge.common.util.FakePlayerFactory')
const $Blocks = Java.loadClass('net.minecraft.world.level.block.Blocks')
const $BlockPos = Java.loadClass('net.minecraft.core.BlockPos')
const $InteractionHand = Java.loadClass('net.minecraft.world.InteractionHand')
const $ServerQuestFile = Java.loadClass('dev.ftb.mods.ftbquests.quest.ServerQuestFile')
const $QuestObjectBase = Java.loadClass('dev.ftb.mods.ftbquests.quest.QuestObjectBase')
const $ProgressChange = Java.loadClass('dev.ftb.mods.ftbquests.util.ProgressChange')
const $JavaUUID = Java.loadClass('java.util.UUID')
const $PaQuestInventoryListener = Java.loadClass('dev.ftb.mods.ftbquests.util.FTBQuestsInventoryListener')
const $PaEmptyStack = Java.loadClass('net.minecraft.world.item.ItemStack').EMPTY
const $CraftingInput = Java.loadClass('net.minecraft.world.item.crafting.CraftingInput')
const $ArrayList = Java.loadClass('java.util.ArrayList')
const $ResourceLocation = Java.loadClass('net.minecraft.resources.ResourceLocation')
const $PaGearData = Java.loadClass('net.silentchaos512.gear.util.GearData')
const $ItemMatchingSystem = Java.loadClass('dev.ftb.mods.ftbquests.integration.item_filtering.ItemMatchingSystem')
const $ComponentMatchType = Java.loadClass('dev.ftb.mods.ftbquests.integration.item_filtering.ItemMatchingSystem$ComponentMatchType')
const $Heightmap = Java.loadClass('net.minecraft.world.level.levelgen.Heightmap$Types')

// ---------------------------------------------------------------- travel (testers: quests that ask you to go somewhere)

// Short names for /pa go. Any dimension id works too, in quotes: /pa go "ad_astra:mars_orbit".
const PA_PLACES = {
  overworld: 'minecraft:overworld', nether: 'minecraft:the_nether', end: 'minecraft:the_end',
  twilight: 'twilightforest:twilight_forest', aether: 'aether:the_aether', otherside: 'deeperdarker:otherside',
  moon: 'ad_astra:moon', mars: 'ad_astra:mars', venus: 'ad_astra:venus', mercury: 'ad_astra:mercury', glacio: 'ad_astra:glacio',
  earth_orbit: 'ad_astra:earth_orbit'
}
// Structures that are in another dimension than the overworld.
const PA_STRUCTURE_DIMS = { 'betterfortresses:fortress': 'minecraft:the_nether' }

// /pa ores: a wall of every hidden ore (startup_scripts/04_hidden_ores.js) in front of you, one row per age with
// a sign, so /pa age 0..6 shows each row turning from rock into ore (owner, 0.6.1 test 2: "a better way to
// test all ores at once"). Rows hold 16 ores; an age with more takes several rows.
const PA_ORE_ROW = 16
const PA_AGE_NAMES = { age_1: 'Age I', age_2: 'Age II', age_3: 'Age III', age_4: 'Age IV', age_4_aero: 'Age IV airships',
  age_5: 'Age V', age_6: 'Age VI', age_7: 'Age VII' }
function paOreWall(player) {
  var level = player.level
  // The way you face, by its name (KubeJS's player.facing prints as south, west...), turned into plain
  // numbers: Direction's methods, BlockPos.relative and getYRot aren't reachable from KubeJS here.
  var STEPS = [[0, 1], [-1, 0], [0, -1], [1, 0]], NAMES = ['south', 'west', 'north', 'east']
  var d = Math.max(0, NAMES.indexOf(String(player.facing)))
  var fx = STEPS[d][0], fz = STEPS[d][1], rx = STEPS[(d + 1) % 4][0], rz = STEPS[(d + 1) % 4][1]
  var bx = Math.floor(player.getX()) + fx * 4, by = Math.floor(player.getY()), bz = Math.floor(player.getZ()) + fz * 4
  var rows = []
  Object.keys(PA_AGE_NAMES).forEach(age => {
    var ores = global.HIDDEN_ORES.filter(o => o[1] == age).map(o => o[0])
    for (var i = 0; i < ores.length; i += PA_ORE_ROW) rows.push({ age: age, ores: ores.slice(i, i + PA_ORE_ROW), first: i == 0 })
  })
  var dim = String(level.dimension)
  var back = NAMES[(d + 2) % 4]
  rows.forEach((row, r) => {
    var y = by + rows.length - 1 - r   // first age on top
    row.ores.forEach((ore, c) => { level.getBlock(bx + rx * (c + 1), y, bz + rz * (c + 1)).set(ore) })
    level.getBlock(bx, y, bz).set('minecraft:smooth_stone')
    var text = row.first ? PA_AGE_NAMES[row.age] : ''
    player.server.runCommandSilent(`execute in ${dim} run setblock ${bx - fx} ${y} ${bz - fz} minecraft:oak_wall_sign[facing=${back}]{front_text:{messages:['${JSON.stringify(text)}','""','""','""']}} replace`)
  })
  return rows.length
}

function paLevel(server, dimId) {
  var found = null
  // KubeJS: a level's `dimension` is its id (a property; dimension() can't be called)
  server.getAllLevels().forEach(l => { if (String(l.dimension) == dimId) found = l })
  return found
}

// A safe spot near 0, 0: the ground in open dimensions; under a ceiling (the Nether), the first room
// with two blocks of air above solid ground; in the void (orbits, sky islands), a small glass platform.
// The End: where its portal drops you (100, 0), on an obsidian platform like the portal's if there's no
// ground there. Its middle is the exit portal: open after the dragon, the column is hollow and the
// "ground" was the island's underside (owner, 2026-11-07: "I end up underneath the End island").
function paGoTo(player, dimId) {
  var server = player.server
  var level = paLevel(server, dimId)
  if (level == null) return `No dimension ${dimId}.`
  var isEnd = dimId == 'minecraft:the_end'
  var x = isEnd ? 100 : 0, z = 0
  level.getChunk(x >> 4, z >> 4)
  var minY = level.getMinBuildHeight()
  var y = -999
  if (level.dimensionType().hasCeiling()) {
    for (var yy = 118; yy > minY + 2 && y == -999; yy--) {
      var below = level.getBlockState(new $BlockPos(x, yy - 1, z))
      if (!below.isAir() && below.getFluidState().isEmpty() && level.getBlockState(new $BlockPos(x, yy, z)).isAir()
        && level.getBlockState(new $BlockPos(x, yy + 1, z)).isAir()) y = yy
    }
  } else {
    var top = level.getHeight($Heightmap.MOTION_BLOCKING_NO_LEAVES, x, z)
    if (top > minY + 1 && !(isEnd && top < 40)) y = top
  }
  if (y == -999 && isEnd) {
    y = 49
    for (var px = -2; px <= 2; px++) for (var pz = -2; pz <= 2; pz++) {
      level.setBlockAndUpdate(new $BlockPos(x + px, y - 1, z + pz), $Blocks.OBSIDIAN.defaultBlockState())
      for (var py = 0; py < 3; py++) level.setBlockAndUpdate(new $BlockPos(x + px, y + py, z + pz), $Blocks.AIR.defaultBlockState())
    }
  }
  if (y == -999) {
    y = 100
    for (var dx = -1; dx <= 1; dx++) for (var dz = -1; dz <= 1; dz++) level.setBlockAndUpdate(new $BlockPos(x + dx, y - 1, z + dz), $Blocks.GLASS.defaultBlockState())
  }
  server.runCommandSilent(`execute in ${dimId} run tp ${player.username} ${x + 0.5} ${y} ${z + 0.5}`)
  return null
}

// The structures the quests ask you to find, from the quest kits' "visit:<task>@structure:<id or #tag>"
// steps: /pa find suggests them, and /pa find on its own lists them (owner, test 11: "doesn't have a
// list of structures for me to find").
function paQuestStructures() {
  var seen = {}, out = []
  Object.keys(global.QUEST_KITS || {}).forEach(k => (global.QUEST_KITS[k] || []).forEach(step => {
    var m = String(step).match(/^visit:(.+)@structure:(.+)$/)
    if (m && !seen[m[2]]) { seen[m[2]] = true; out.push({ title: m[1], id: m[2] }) }
  }))
  return out.sort((a, b) => a.title < b.title ? -1 : 1)
}

// The kit's "go there" steps, as links in chat.
function paSayVisits(player, visits) {
  if (!visits.length) return
  var line = Text.gray('Still to do in person (click to go): ')
  visits.forEach((v, i) => {
    var at = v.lastIndexOf('@')
    var title = at > 0 ? v.substring(0, at) : v
    var where = at > 0 ? v.substring(at + 1) : ''
    var link = Text.aqua(`[${title}]`)
    if (where.startsWith('structure:')) link = link.clickRunCommand(`/pa find "${where.substring(10)}"`).hover(Text.of('Locate the nearest one, then click its coordinates'))
    else if (where) link = link.clickRunCommand(`/pa go "${where}"`).hover(Text.of(`Teleport to ${where}`))
    line = line.append(i ? Text.gray(' ') : Text.of('')).append(link)
  })
  player.tell(line)
}

const STAGES = ['age_1', 'age_2', 'age_3', 'age_4', 'age_5', 'age_6', 'age_7']
const DUMP_PATH = 'kubejs/exports/progression_dump.json'

// Unlocks inside an age (global.SUB_STAGES), e.g. AE2 partway through Age 5.
function subStagesOf(age) {
  return (global.SUB_STAGES[`age_${age}`] || []).map(sub => sub.stage)
}

function setStage(player, stage, want) {
  const has = AStages.playerHasStage(player, stage)
  if (want && !has) AStages.addStageToPlayer(player, stage, false, false, false)
  if (!want && has) AStages.removeStageFromPlayer(player, stage, false, false, false)
}

function setAge(player, age) {
  STAGES.forEach((stage, i) => setStage(player, stage, i + 1 <= age))
  // An age's inner unlocks belong to players who are past that age.
  for (let a = 0; a <= 7; a++) subStagesOf(a).forEach(stage => setStage(player, stage, a < age))
  // Going back before Age 2 restarts the bronze tool gate (age1.js).
  if (age < 2) {
    player.stages.remove('bronze_tools')
    Object.keys(BRONZE_TOOLS).forEach(id => {
      const tool = BRONZE_TOOLS[id]
      player.stages.remove(`bronze_${tool}`)
      player.persistentData.remove(`project_ages_bronze_${tool}`)
    })
  }
  // The space base (age7.js) is the end of the pack: setting any age starts it over.
  SPACE_STAGES.forEach(stage => player.stages.remove(stage))
  player.persistentData.remove('pa_heart_forged')
  player.persistentData.remove('pa_heart_serial') // the Heart of the Ages (heart.js) starts over too
  player.server.runCommandSilent(`team leave ${player.username}`)
  paChronicleReset(player, age) // chronicle.js: later chapters of the lore book close again
  Object.keys(PLANETS).forEach(dim => player.persistentData.remove(`project_ages_space_base/${dim}`))
  // The quest book shows chapters by quest completion, not by age: complete every
  // earlier age's chapter and reset the rest so the book matches.
  const chapters = global.AGE_CHAPTERS || {}
  Object.keys(chapters).forEach(key => {
    const chapterAge = parseInt(key.split('_')[1])
    setChapterProgress(player, chapters[key], chapterAge < age)
  })
}

// Like setAge, but never takes anything away: adds missing ages up to `age` and marks
// every earlier age's chapter done (so the age's own chapter unlocks).
function raiseToAge(player, age) {
  STAGES.forEach((stage, i) => {
    if (i + 1 <= age && !AStages.playerHasStage(player, stage)) AStages.addStageToPlayer(player, stage, false, false, false)
  })
  // The kit hands out the whole age, so its inner unlocks too (else those items drop).
  for (let a = 0; a <= age; a++) subStagesOf(a).forEach(stage => setStage(player, stage, true))
  const chapters = global.AGE_CHAPTERS || {}
  Object.keys(chapters).forEach(key => {
    if (parseInt(key.split('_')[1]) < age) setChapterProgress(player, chapters[key], true)
  })
}

// Quests unlock one after another and FTB checks items in a single pass, so check a few
// times in a row to let a whole chain of quests catch up with what the player holds.
function recheckQuests(player) {
  for (let i = 0; i < 12; i++) $PaQuestInventoryListener.detect(player, $PaEmptyStack, 0)
}

function findQuestObject(hexId) {
  const id = $QuestObjectBase.parseHexId(hexId)
  return id.isPresent() ? $ServerQuestFile.INSTANCE.getBase(id.get()) : null
}

// Does what `/ftbquests change_progress` does inside, without the command: run as the player,
// that command did nothing for a friend who isn't an operator (owner's test 2026-11-05:
// `/pa age 7 <friend>`), and from the server console it doesn't take the chapter id at all.
function setChapterProgress(player, hexId, complete) {
  const chapter = findQuestObject(hexId)
  if (chapter == null) {
    console.warn(`/pa: no quest chapter ${hexId}`)
    return
  }
  $ServerQuestFile.INSTANCE.getTeamData(player).ifPresent(data =>
    chapter.forceProgress(data, new $ProgressChange(chapter, $JavaUUID.fromString(String(player.uuid))).setReset(!complete)))
}

// Merge kit lists: the same item twice keeps the larger count.
function mergeKits(lists) {
  const counts = {}
  const order = []
  lists.forEach(list => (list || []).forEach(entry => {
    const m = String(entry).match(/^(\d+)x (.+)$/)
    const key = m ? m[2] : String(entry)
    const n = m ? parseInt(m[1]) : 1
    if (!(key in counts)) order.push(key)
    counts[key] = Math.max(counts[key] || 0, n)
  }))
  return order.map(key => key.indexOf(':') > 0 && !/^(stage|advancement|visit):/.test(key) ? `${counts[key]}x ${key}` : key)
}

// A kit: items to give, plus 'stage:' / 'advancement:' entries to grant and 'visit:' notes.
// Returns [unknown item ids, places to visit].
function giveKitList(player, kit) {
  let missing = []
  let visits = []
  let leftovers = []
  kit.forEach(entry => {
    const text = String(entry)
    if (text.startsWith('stage:')) { player.stages.add(text.substring(6)); return }
    if (text.startsWith('advancement:')) {
      player.server.runCommandSilent(`advancement grant ${player.username} only ${text.substring(12)}`)
      return
    }
    if (text.startsWith('visit:')) { visits.push(text.substring(6)); return }
    const m = String(entry).match(/^(\d+)x (.+)$/)
    const count = m ? parseInt(m[1]) : 1
    const spec = m ? m[2] : String(entry) // may carry components: id[component=value]
    const id = spec.split('[')[0]
    if (!$BuiltInRegistries.ITEM.containsKey(id)) {
      missing.push(id)
      return
    }
    var stack = Item.of(spec, count)
    player.getInventory().add(stack)
    if (!stack.isEmpty()) leftovers.push(stack)
  })
  if (leftovers.length) kitChests(player, leftovers, visits)
  return [missing, visits]
}

// What didn't fit in the inventory goes into chests beside the player (not onto the floor,
// where quests can't see it and it would despawn).
function kitChests(player, stacks, notes) {
  var placed = 0
  var offsets = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]
  for (var o = 0; o < offsets.length && stacks.length; o++) {
    var block = player.block.offset(offsets[o][0], 0, offsets[o][1])
    if (!block.id.equals('minecraft:air')) continue
    block.set('minecraft:chest')
    var inv = block.inventory
    for (var slot = 0; slot < inv.slots && stacks.length; slot++) inv.insertItem(slot, stacks.shift(), false)
    placed++
  }
  stacks.forEach(st => player.give(st))
  if (placed) notes.push(`${placed} chest(s) next to you hold what didn't fit`)
}

// kits: global.COMPLETE_KITS (/pa kit) or global.AGE_KITS (/pa start's arrival kit).
function giveKit(player, age, kits) {
  return giveKitList(player, kits[`age_${age}`] || [])
}

function currentAge(player) {
  let age = 0
  STAGES.forEach((stage, i) => { if (AStages.playerHasStage(player, stage)) age = i + 1 })
  return age
}

function dumpProgressionData(server) {
  const registryAccess = server.registryAccess()
  const recipes = []
  let skipped = 0
  server.recipeManager.getRecipes().forEach(holder => {
    const recipe = holder.value()
    const id = String(holder.id())
    const type = String($BuiltInRegistries.RECIPE_TYPE.getKey(recipe.getType()))
    let out, ingredients
    try {
      out = recipe.getResultItem(registryAccess)
      ingredients = recipe.getIngredients()
    } catch (e) {
      out = null
    }
    if (!out || out.isEmpty()) {
      // Result not readable through the standard API; audit.py reads it from the recipe JSON.
      skipped++
      recipes.push({ id: id, type: type, out: null, count: 1, inputs: [] })
      return
    }
    const inputs = []
    ingredients.forEach(ingredient => {
      const ids = {}
      ingredient.getStackArray().forEach(stack => { ids[String(stack.id)] = true })
      const list = Object.keys(ids)
      if (list.length) inputs.push(list)
    })
    const entry = {
      id: id,
      type: type,
      out: String(out.id),
      count: out.count,
      inputs: inputs
    }
    if (typeof recipe.getWidth === 'function') {
      entry.w = recipe.getWidth()
      entry.h = recipe.getHeight()
    }
    recipes.push(entry)
  })
  const items = []
  $BuiltInRegistries.ITEM.keySet().forEach(key => items.push(String(key)))
  const tags = {}
  $BuiltInRegistries.ITEM.getTags().forEach(pair => {
    const members = []
    pair.getSecond().forEach(holder => members.push(String(holder.unwrapKey().get().location())))
    tags[String(pair.getFirst().location())] = members
  })
  const data = {
    recipes: recipes,
    skipped: skipped,
    items: items,
    tags: tags,
    modGates: global.MOD_GATES,
    earlyItems: global.EARLY_ITEMS,
    lateItems: global.LATE_ITEMS,
    targets: global.AGE_TARGETS
  }
  JsonIO.write(DUMP_PATH, JsonIO.parseRaw(JSON.stringify(data)))
  return { recipes: recipes.length, skipped: skipped, items: items.length }
}

ServerEvents.commandRegistry(event => {
  const { commands: Commands, arguments: Arguments } = event
  const ageArg = () => Commands.argument('age', Arguments.INTEGER.create(event))
  const playersArg = () => Commands.argument('players', Arguments.PLAYERS.create(event))

  function targets(ctx, withPlayers) {
    if (!withPlayers) return [ctx.source.playerOrException]
    const list = []
    Arguments.PLAYERS.getResult(ctx, 'players').forEach(p => list.push(p))
    return list
  }

  function readAge(ctx) {
    const age = Arguments.INTEGER.getResult(ctx, 'age')
    if (age < 0 || age > 7) throw new Error('Age must be 0-7')
    return age
  }

  // Minecraft hides script errors behind "An unexpected error occurred"; show the real one.
  function guarded(ctx, run) {
    try {
      return run()
    } catch (e) {
      console.error(`/pa failed: ${e}`)
      ctx.source.sendSystemMessage(Text.red(`/pa failed: ${e}`))
      return 0
    }
  }

  function forAge(action) {
    return ageArg()
      .executes(ctx => guarded(ctx, () => action(ctx, readAge(ctx), targets(ctx, false))))
      .then(playersArg().executes(ctx => guarded(ctx, () => action(ctx, readAge(ctx), targets(ctx, true)))))
  }

  const reply = (ctx, text) => ctx.source.sendSystemMessage(text)

  const doAge = (ctx, age, players) => {
    players.forEach(p => setAge(p, age))
    reply(ctx, Text.green(`Set ${players.length} player(s) to Age ${age}.`))
    return players.length
  }
  const giveKits = (ctx, age, players, kits, label) => {
    if (!kits[`age_${age}`]) {
      reply(ctx, Text.yellow(`There's no ${label} for Age ${age} yet (it's added when that age is built).`))
      return 0
    }
    players.forEach(p => {
      const result = kits === global.COMPLETE_KITS
        ? giveKitList(p, mergeKits([global.QUEST_KITS[`age_${age}`], global.COMPLETE_KITS[`age_${age}`]]))
        : giveKit(p, age, kits)
      if (result[0].length) reply(ctx, Text.red(`Kit ${age}: unknown items skipped: ${result[0].join(', ')}`))
      paSayVisits(p, result[1])
      recheckQuests(p)
    })
    reply(ctx, Text.green(`Gave the Age ${age} ${label} to ${players.length} player(s).`))
    return players.length
  }
  const doKit = (ctx, age, players) => {
    // Without the age, its items are locked and get dropped; without the earlier chapters
    // done, its quest chapter stays locked.
    if (global.COMPLETE_KITS[`age_${age}`]) players.forEach(p => raiseToAge(p, age))
    return giveKits(ctx, age, players, global.COMPLETE_KITS, 'completion kit')
  }
  const doStart = (ctx, age, players) => {
    doAge(ctx, age, players)
    return giveKits(ctx, age, players, global.AGE_KITS, 'arrival kit')
  }

  // Side chapters: which age each needs (its quests wait for that age's mods).
  const SIDE_KITS = { survival: ['side_survival', 1], kitchen: ['side_kitchen', 1], magic: ['side_magic', 5],
    workshop: ['side_workshop', 4], automation: ['side_automation', 5], glory: ['side_glory', 7], warfare: ['age_6_warfare', 6],
    space: ['age_7_space', 7] }
  const doSideKit = (ctx, name) => {
    const side = SIDE_KITS[name]
    if (!side) { reply(ctx, Text.red(`Unknown chapter. Try: ${Object.keys(SIDE_KITS).join(', ')}`)); return 0 }
    const p = ctx.source.playerOrException
    raiseToAge(p, side[1])
    const result = giveKitList(p, mergeKits([global.QUEST_KITS[side[0]]]))
    if (result[0].length) reply(ctx, Text.red(`Unknown items skipped: ${result[0].join(', ')}`))
    paSayVisits(p, result[1])
    recheckQuests(p)
    reply(ctx, Text.green(`Gave the ${name} kit (and raised you to Age ${side[1]}).`))
    return 1
  }

  event.register(Commands.literal('pa')
    .requires(source => source.hasPermission(2))
    .then(Commands.literal('sidekit').then(Commands.argument('chapter', Arguments.STRING.create(event))
      .suggests((ctx, builder) => { Object.keys(SIDE_KITS).forEach(k => builder.suggest(k)); return builder.buildFuture() })
      .executes(ctx => guarded(ctx, () => doSideKit(ctx, String(Arguments.STRING.getResult(ctx, 'chapter')))))))
    .then(Commands.literal('ores').executes(ctx => guarded(ctx, () => {
      const rows = paOreWall(ctx.source.playerOrException)
      reply(ctx, Text.green(`Built ${global.HIDDEN_ORES.length} hidden ores in ${rows} rows in front of you. Try /pa age 0 to 6.`))
      return 1
    })))
    .then(Commands.literal('go').then(Commands.argument('place', Arguments.STRING.create(event))
      .suggests((ctx, builder) => { Object.keys(PA_PLACES).forEach(k => builder.suggest(k)); return builder.buildFuture() })
      .executes(ctx => guarded(ctx, () => {
        const p = ctx.source.playerOrException
        const name = String(Arguments.STRING.getResult(ctx, 'place'))
        const dim = PA_PLACES[name] || name
        const why = paGoTo(p, dim)
        if (why) { reply(ctx, Text.red(why)); return 0 }
        reply(ctx, Text.green(`Sent you to ${dim}.`))
        return 1
      }))))
    .then(Commands.literal('find')
      .executes(ctx => guarded(ctx, () => {
        var p = ctx.source.playerOrException
        var line = Text.gray('Find (click one): ')
        paQuestStructures().forEach((s, i) => {
          line = line.append(i ? Text.gray(' ') : Text.of(''))
            .append(Text.aqua(`[${s.title.replace(/^Find (a |an |the )?/, '')}]`).clickRunCommand(`/pa find "${s.id}"`).hover(Text.of(s.id)))
        })
        p.tell(line)
        return 1
      }))
      .then(Commands.argument('structure', Arguments.STRING.create(event))
      .suggests((ctx, builder) => { paQuestStructures().forEach(s => builder.suggest(`"${s.id}"`)); return builder.buildFuture() })
      .executes(ctx => guarded(ctx, () => {
        const p = ctx.source.playerOrException
        const id = String(Arguments.STRING.getResult(ctx, 'structure'))
        const dim = PA_STRUCTURE_DIMS[id] || 'minecraft:overworld'
        if (String(p.level.dimension) != dim) paGoTo(p, dim)
        // Run as the player, so the coordinates it prints can be clicked to teleport there.
        ctx.source.server.scheduleInTicks(20, () => {
          ctx.source.server.getCommands().performPrefixedCommand(p.createCommandSourceStack(), `locate structure ${id}`)
        })
        return 1
      }))))
    .then(Commands.literal('age').then(forAge(doAge)))
    .then(Commands.literal('kit').then(forAge(doKit)))
    .then(Commands.literal('start').then(forAge(doStart)))
    .then(Commands.literal('status')
      .executes(ctx => {
        const p = ctx.source.playerOrException
        reply(ctx, Text.gold(`${p.username}: Age ${currentAge(p)}`))
        return 1
      })
      .then(playersArg().executes(ctx => {
        Arguments.PLAYERS.getResult(ctx, 'players').forEach(p => reply(ctx, Text.gold(`${p.username}: Age ${currentAge(p)}`)))
        return 1
      })))
    .then(Commands.literal('selftest').executes(ctx => {
      // Checks pack mechanics that need a player, using a fake one.
      const server = ctx.source.server
      const level = server.overworld()
      const fake = $FakePlayerFactory.getMinecraft(level)
      const log = $Blocks.OAK_LOG.defaultBlockState()
      const pos = $BlockPos.ZERO
      const results = []
      let bare, hatchet // declared outside try: Rhino rejects const inside try here
      try {
        fake.setItemInHand($InteractionHand.MAIN_HAND, Item.of('minecraft:air'))
        bare = log.getDestroyProgress(fake, level, pos)
        fake.setItemInHand($InteractionHand.MAIN_HAND, Item.of('kubejs:flint_hatchet'))
        hatchet = log.getDestroyProgress(fake, level, pos)
        results.push(`log by hand: ${bare} (want 0) ${bare == 0 ? 'OK' : 'FAIL'}`)
        results.push(`log with hatchet: ${hatchet} (want > 0) ${hatchet > 0 ? 'OK' : 'FAIL'}`)
      } catch (e) {
        results.push(`log break speed check threw: ${e}`)
      }
      // "Any planks"-style quests use FTB Filter System smart filters, which FTB Quests only
      // understands with FTB XMod Compat installed.
      let plankFilter, plankMatch // outside try: Rhino rejects const inside try here
      try {
        plankFilter = Item.of('ftbfiltersystem:smart_filter[ftbfiltersystem:filter="item_tag(minecraft:planks)"]')
        plankMatch = $ItemMatchingSystem.INSTANCE.doesItemMatch(plankFilter, Item.of('minecraft:oak_planks'), $ComponentMatchType.NONE, server.registryAccess())
        results.push(`quest tag filter matches planks: ${plankMatch ? 'OK' : 'FAIL'}`)
      } catch (e) {
        results.push(`quest tag filter check threw: ${e}`)
      }
      // Age 1's gate needs to see a bronze head on a crafted Silent Gear tool (age1.js).
      let rods, pick, headPart, gearStep = 'start'
      const craft = (recipeId, stacks) => {
        gearStep = `${recipeId}: find recipe`
        const recipe = server.recipeManager.byKey($ResourceLocation.parse(recipeId)).get().value()
        gearStep = `${recipeId}: build input`
        const list = new $ArrayList()
        stacks.forEach(st => list.add(st))
        while (list.size() < 9) list.add($PaEmptyStack)
        const input = $CraftingInput.of(3, 3, list)
        gearStep = `${recipeId}: match`
        if (!recipe.matches(input, level)) throw new Error(`${recipeId} doesn't match its inputs`)
        gearStep = `${recipeId}: assemble`
        return recipe.assemble(input, server.registryAccess())
      }
      try {
        try {
          rods = craft('silentgear:part/rod', [Item.of('silentgear:rod_template'), Item.of('minecraft:stick'), Item.of('minecraft:stick')])
        } catch (e) {
          rods = craft('silentgear:part/rod', [Item.of('silentgear:rod_template'), Item.of('minecraft:oak_planks'), Item.of('minecraft:oak_planks')])
        }
        pick = craft('silentgear:gear/pickaxe_quick', [Item.of('silentgear:pickaxe_template'), Item.of('mekanism:ingot_bronze'), Item.of('mekanism:ingot_bronze'), Item.of('mekanism:ingot_bronze'), rods.copyWithCount(1)])
        gearStep = 'read head'
        headPart = $PaGearData.getCoatingOrMainPart(pick)
        results.push(`bronze pickaxe head: ${headPart ? String(headPart.getId()) : 'none'}`)
        results.push(`age1.js reads bronze pickaxe head as: '${headMaterial(pick)}' (want silentgear:bronze) ${headMaterial(pick) == 'silentgear:bronze' ? 'OK' : 'FAIL'}`)
      } catch (e) {
        results.push(`bronze pickaxe check threw at ${gearStep}: ${e}`)
      }
      // /pa age syncs the quest book through these chapter ids.
      const chapters = global.AGE_CHAPTERS || {}
      Object.keys(chapters).forEach(key => {
        let found = null
        try {
          found = findQuestObject(chapters[key])
        } catch (e) {
          results.push(`chapter lookup ${key} threw: ${e}`)
          return
        }
        results.push(`quest chapter ${key}: ${found ? 'found OK' : 'MISSING FAIL'}`)
      })
      results.forEach(line => reply(ctx, Text.of(`PA_SELFTEST ${line}`)))
      reply(ctx, Text.of('PA_SELFTEST_DONE'))
      return 1
    }))
    .then(Commands.literal('dump').executes(ctx => {
      let result
      try {
        result = dumpProgressionData(ctx.source.server)
      } catch (e) {
        console.error(`PA_DUMP_FAILED ${e}`)
        reply(ctx, Text.red(`Progression dump failed: ${e}`))
        return 0
      }
      reply(ctx, Text.green(`Progression dump written to ${DUMP_PATH}: ${result.recipes} recipes, ${result.items} items (${result.skipped} recipes without a readable result skipped).`))
      console.info(`PA_DUMP_DONE ${result.recipes} ${result.items}`)
      return 1
    }))
  )
})
