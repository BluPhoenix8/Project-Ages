// The Heart of the Ages: the pack's final item, and a demigod's powers for whoever forged it.
//
// - Bound: the first time a player holds a fresh Heart it is bound to them (owner + a
//   serial number stored on the item and on the player). Only the owner's current Heart
//   does anything.
// - One per person: a player who already owns a Heart and crafts another gets the
//   ingredients back instead.
// - Unlosable, unstealable: every second the owner's inventory, Curios "Heart" slot, cursor and
//   crafting grid are checked. If their Heart isn't on them (dropped, lost in lava or the void,
//   taken from their corpse), a new one appears and the old one stops working. Any copy that
//   isn't the owner's current one vanishes from whoever holds it. While a crafting table or
//   chest is open the Heart may sit in it; closing it puts the Heart back on its owner (0.4.41:
//   it used to "return" mid-craft and leave a copy in a Visual Workbench).
// - On and off: sneak + right-click with it in hand switches its powers off and on (it glows
//   while on). It returns to its owner either way (owner's call, 0.4.41).
// - The Curios "Heart" slot keeps it on death (data/projectages/curios/slots/heart.json).
// - Powers while carried: creative-style flight, Regeneration, Fire Resistance, Night
//   Vision. Hunger still applies: a demigod, not a god.
// - The crown: owners join the "Ascended" team (gold name, "✦ Ascended" before it).
// - The Heart is also a creator's tool: server_scripts/heart_creative.js.

const PA_HEART = 'kubejs:heart_of_the_ages'
const PA_HEART_REFUND = [
  'kubejs:lunar_core', 'kubejs:martian_core', 'kubejs:venusian_core', 'kubejs:mercurian_core',
  'kubejs:glacian_core', 'kubejs:emblem_of_the_ages', 'mekanism:pellet_antimatter',
  '2x mekanism:ultimate_control_circuit'
]
const PA_HEART_EFFECTS = [
  ['minecraft:regeneration', 0],
  ['minecraft:fire_resistance', 0],
  ['minecraft:night_vision', 0]
]
const $PaCuriosApi = Java.loadClass('top.theillusivec4.curios.api.CuriosApi')
const $PaDataComponents = Java.loadClass('net.minecraft.core.component.DataComponents')
const $PaCustomData = Java.loadClass('net.minecraft.world.item.component.CustomData')
const $PaItemLore = Java.loadClass('net.minecraft.world.item.component.ItemLore')
const $PaCompoundTag = Java.loadClass('net.minecraft.nbt.CompoundTag')
const $PaList = Java.loadClass('java.util.List')
const $PaItemStack = Java.loadClass('net.minecraft.world.item.ItemStack')
const $PaUUID = Java.loadClass('java.util.UUID')

function paHeartSlot(player) {
  const inv = $PaCuriosApi.getCuriosInventory(player)
  if (!inv.isPresent()) return null
  const handler = inv.get().getStacksHandler('heart')
  return handler.isPresent() ? handler.get().getStacks() : null
}

function paHeartData(stack) {
  const data = stack.get($PaDataComponents.CUSTOM_DATA)
  return data ? data.copyTag() : null
}

function paMakeHeart(player, serial) {
  const stack = Item.of(PA_HEART)
  const tag = new $PaCompoundTag()
  tag.putString('pa_owner', String(player.uuid))
  tag.putString('pa_owner_name', player.username)
  tag.putInt('pa_serial', serial)
  stack.set($PaDataComponents.CUSTOM_DATA, $PaCustomData.of(tag))
  stack.set($PaDataComponents.LORE, new $PaItemLore($PaList.of(
    Text.gold(`Bound to ${player.username}`).italic(false),
    Text.gray('Soulbound: it always returns to its owner.').italic(false),
    Text.gray('Sneak + right-click: powers on/off.').italic(false))))
  return stack
}

function paCrown(player) {
  const server = player.server
  server.runCommandSilent('team add pa_ascended')
  server.runCommandSilent('team modify pa_ascended color gold')
  server.runCommandSilent('team modify pa_ascended prefix {"text":"✦ Ascended ","color":"gold"}')
  server.runCommandSilent(`team join pa_ascended ${player.username}`)
}

// True if this is its owner's current Heart (and the owner is online).
function paHeartIsCurrent(stack) {
  const tag = paHeartData(stack)
  if (!tag || !tag.contains('pa_owner')) return false
  const owner = Utils.server.getPlayerList().getPlayer($PaUUID.fromString(tag.getString('pa_owner')))
  return owner != null && tag.getInt('pa_serial') == owner.persistentData.getInt('pa_heart_serial')
}

// Looks through the player's inventory, Heart slot, cursor and crafting grid. Returns true if
// the player holds their own current Heart (or has a container open, where it may be sitting).
function paCheckHearts(player) {
  const pd = player.persistentData
  const me = String(player.uuid)
  let serial = pd.getInt('pa_heart_serial')
  let found = false
  const visit = (stack, clear) => {
    if (stack.isEmpty() || stack.id != PA_HEART) return
    const tag = paHeartData(stack)
    if (!tag || !tag.contains('pa_owner')) {
      if (serial == 0 && !found) {
        // A freshly forged Heart: bind it to this player.
        serial = 1
        pd.putInt('pa_heart_serial', serial)
        clear(paMakeHeart(player, serial))
        found = true
        paCrown(player)
        player.tell(Text.gold('The Heart of the Ages is bound to you. It will never leave you.'))
      } else {
        // One per person: give the ingredients back.
        clear($PaItemStack.EMPTY)
        PA_HEART_REFUND.forEach(id => player.give(Item.of(id)))
        player.tell(Text.yellow('You already carry a Heart of the Ages. Only one can be yours; the ingredients are returned.'))
      }
      return
    }
    if (tag.getString('pa_owner') != me) {
      clear($PaItemStack.EMPTY)
      player.tell(Text.gray(`The Heart slips away, back to ${tag.getString('pa_owner_name')}.`))
      return
    }
    if (tag.getInt('pa_serial') != serial || found) {
      clear($PaItemStack.EMPTY) // an old or extra copy of your own Heart
      return
    }
    found = true
    // It glows while its powers are on.
    const on = !pd.getBoolean('pa_heart_off')
    if (String(stack.get($PaDataComponents.ENCHANTMENT_GLINT_OVERRIDE)) != String(on)) stack.set($PaDataComponents.ENCHANTMENT_GLINT_OVERRIDE, on)
  }
  const inv = player.getInventory()
  for (let i = 0; i < inv.getContainerSize(); i++) {
    visit(inv.getItem(i), s => inv.setItem(i, s))
  }
  const slot = paHeartSlot(player)
  if (slot) {
    for (let i = 0; i < slot.getSlots(); i++) {
      visit(slot.getStackInSlot(i), s => slot.setStackInSlot(i, s))
    }
  }
  // Being moved (on the cursor), or in the inventory's own 2x2 crafting grid.
  const menu = player.containerMenu
  visit(menu.getCarried(), s => menu.setCarried(s))
  const grid = player.inventoryMenu.getCraftSlots()
  for (let i = 0; i < grid.getContainerSize(); i++) {
    visit(grid.getItem(i), s => grid.setItem(i, s))
  }
  // A crafting table or chest is open: the Heart may be in it. Closing it brings the Heart back.
  if (!found && serial > 0 && menu != player.inventoryMenu) return true
  // (Declared up here: KubeJS's Rhino rejects a const inside a block the second time a
  // function runs.)
  let fresh = null
  if (serial > 0 && !found) {
    // The owner's Heart isn't with them: a new one returns, and the lost one stops working.
    fresh = paMakeHeart(player, serial + 1)
    if (slot && slot.getStackInSlot(0).isEmpty()) {
      pd.putInt('pa_heart_serial', serial + 1)
      slot.setStackInSlot(0, fresh)
      found = true
    } else if (inv.getFreeSlot() >= 0) {
      pd.putInt('pa_heart_serial', serial + 1)
      inv.add(fresh)
      found = true
    }
    if (found) player.tell(Text.gold('The Heart of the Ages returns to you.'))
  }
  return found
}

// Closing a crafting table, chest or any other container: the owner's Heart comes back out.
PlayerEvents.inventoryClosed(event => {
  const player = event.player
  const menu = event.inventoryContainer
  if (player.persistentData.getInt('pa_heart_serial') == 0 || menu == player.inventoryMenu) return
  const inv = player.getInventory()
  menu.slots.forEach(s => {
    const stack = s.getItem()
    if (s.container == inv || stack.isEmpty() || stack.id != PA_HEART) return
    const tag = paHeartData(stack)
    if (!tag || tag.getString('pa_owner') != String(player.uuid)) return
    const heart = stack.copy()
    s.set($PaItemStack.EMPTY)
    const slot = paHeartSlot(player)
    if (slot && slot.getStackInSlot(0).isEmpty()) slot.setStackInSlot(0, heart)
    else if (!inv.add(heart)) player.drop(heart, false)
  })
})

// Sneak + right-click with it in hand: powers off or back on.
ItemEvents.rightClicked(PA_HEART, event => {
  const player = event.player
  if (!player.isShiftKeyDown()) return
  const tag = paHeartData(event.item)
  if (!tag || tag.getString('pa_owner') != String(player.uuid)) return
  const pd = player.persistentData
  const off = !pd.getBoolean('pa_heart_off')
  pd.putBoolean('pa_heart_off', off)
  event.item.set($PaDataComponents.ENCHANTMENT_GLINT_OVERRIDE, !off)
  if (off) {
    paApplyPowers(player, false)
    PA_HEART_EFFECTS.forEach(e => player.server.runCommandSilent(`effect clear ${player.username} ${e[0]}`))
  }
  player.setStatusMessage(off ? Text.gray('Heart of the Ages: powers off') : Text.gold('Heart of the Ages: powers on'))
  event.cancel()
})

function paApplyPowers(player, powered) {
  const pd = player.persistentData
  if (powered) {
    PA_HEART_EFFECTS.forEach(e => {
      if (player.potionEffects.getDuration(e[0]) < 260) player.potionEffects.add(e[0], 400, e[1], true, false)
    })
    if (!player.abilities.mayfly) {
      player.abilities.mayfly = true
      player.onUpdateAbilities()
    }
    pd.putBoolean('pa_heart_flight', true)
  } else if (pd.getBoolean('pa_heart_flight')) {
    pd.putBoolean('pa_heart_flight', false)
    if (!player.isCreative() && !player.isSpectator()) {
      player.abilities.mayfly = false
      player.abilities.flying = false
      player.onUpdateAbilities()
    }
  }
}

PlayerEvents.tick(event => {
  const player = event.player
  if (player.tickCount % 20 != 0 || !player.isAlive()) return
  const held = paCheckHearts(player)
  paApplyPowers(player, held && !player.persistentData.getBoolean('pa_heart_off'))
})

PlayerEvents.loggedIn(event => {
  const player = event.player
  if (player.persistentData.getInt('pa_heart_serial') > 0) paCrown(player)
})

// A dropped Heart: an owner's copy vanishes (it returns to them within a second); a fresh,
// unbound one can't burn, explode or despawn.
EntityEvents.spawned('minecraft:item', event => {
  const entity = event.entity
  const stack = entity.item
  if (!stack || stack.id != PA_HEART) return
  const tag = paHeartData(stack)
  if (tag && tag.contains('pa_owner')) {
    event.cancel()
    return
  }
  entity.setUnlimitedLifetime()
  entity.setInvulnerable(true)
})
