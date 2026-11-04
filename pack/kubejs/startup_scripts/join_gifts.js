// Ars Nouveau gives every new player a Starbuncle plush plus a chat ad for the
// real-life plush (no config for it). It only does so while its public switch
// Rewards.SEND_ONE_TIME_MESSAGE is on, which Ars sets from a file it downloads at
// startup. Turning the switch off just before Ars's login handler runs (highest
// priority) means neither the plush nor the ad ever appear.
// (Setting Ars's per-player flag doesn't work from KubeJS: KubeJS redirects
// getPersistentData() to its own storage.)
// server_scripts/first_join.js still sweeps up any plush that slips through.

const $PlayerLoggedInEvent = Java.loadClass('net.neoforged.neoforge.event.entity.player.PlayerEvent$PlayerLoggedInEvent')
const $EventPriority = Java.loadClass('net.neoforged.bus.api.EventPriority')
const $ArsRewards = Java.loadClass('com.hollingsworth.arsnouveau.setup.reward.Rewards')

NativeEvents.onEvent($EventPriority.HIGHEST, $PlayerLoggedInEvent, event => {
  $ArsRewards.SEND_ONE_TIME_MESSAGE = false
})
