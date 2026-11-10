// Item tags for quests that take "any one" of a mod's items (owner, 2026-11-06: every mod players
// can try should be in the quest book). tools/scripts/gen_quests.py turns a "#tag" task into an FTB
// Filter System smart filter, with the icon and title in its TAG_DISPLAY.

ServerEvents.tags('item', event => {
  // Where quest_tag_items.js (generated) lists what you can make by that quest's age, only those count
  // (owner, 0.6.1 test 2: a trumpet in the Age I instruments quest can't be made yet).
  const lists = typeof PA_QUEST_TAG_ITEMS == 'undefined' ? {} : PA_QUEST_TAG_ITEMS
  const add = (tag, all) => event.add(tag, lists[tag] && lists[tag].length ? lists[tag] : all)
  add('projectages:quest/macaws', /^mcw(roofs|windows|doors|stairs|fences|bridges):/)
  add('projectages:quest/refurbished', /^refurbished_furniture:/)
  add('projectages:quest/instruments', /^immersive_melodies:/)
  event.add('projectages:quest/artifacts', /^artifacts:/) // found, not made: all of them
  add('projectages:quest/sleeping_bags', /^comforts:sleeping_bag_/) // 0.6.0
  add('projectages:quest/suppsquared', /^suppsquared:/) // 0.6.0
})
