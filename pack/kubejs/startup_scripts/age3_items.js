// Age 3 (The Twilight) items. Recipes and the Age 4 gate live in server_scripts/age3.js.

StartupEvents.registry('item', event => {
  // Ironwood + the Lich's Exanimate Essence: the one Twilight Forest item the pack ever
  // asks for. Crafting it opens Age 4 (Create).
  event.create('steam_core').displayName('Steam Core').maxStackSize(16).rarity('rare')
})
