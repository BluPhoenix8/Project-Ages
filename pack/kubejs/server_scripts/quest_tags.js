// Item tags for quests that take "any one" of a mod's items (owner, 2026-11-06: every mod players
// can try should be in the quest book). tools/scripts/gen_quests.py turns a "#tag" task into an FTB
// Filter System smart filter, with the icon and title in its TAG_DISPLAY.

ServerEvents.tags('item', event => {
  event.add('projectages:quest/macaws', /^mcw(roofs|windows|doors|stairs|fences|bridges):/)
  event.add('projectages:quest/refurbished', /^refurbished_furniture:/)
  event.add('projectages:quest/connected_glass', /^connectedglass:/)
  event.add('projectages:quest/instruments', /^immersive_melodies:/)
  event.add('projectages:quest/artifacts', /^artifacts:/)
  event.add('projectages:quest/sleeping_bags', /^comforts:sleeping_bag_/) // 0.6.0
  event.add('projectages:quest/suppsquared', /^suppsquared:/) // 0.6.0
})
