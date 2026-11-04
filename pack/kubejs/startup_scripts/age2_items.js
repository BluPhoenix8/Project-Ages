// Age 2 (Medieval & Ritual) items. Recipes and the Age 3 gate live in server_scripts/age2.js.

StartupEvents.registry('item', event => {
  // Crafted on the Enchanting Apparatus; thrown into a portal pool, it lights the
  // Twilight Forest portal (the only item that can).
  event.create('twilight_key').displayName('Twilight Key').maxStackSize(16)
})
