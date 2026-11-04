// Age 1 (Bronze) items. Recipes and the Age 2 gate live in server_scripts/age1.js.

StartupEvents.registry('item', event => {
  // Copper and tin crushed together, ready to smelt into bronze in the Bloomery.
  event.create('bronze_blend').displayName('Bronze Blend')
})
