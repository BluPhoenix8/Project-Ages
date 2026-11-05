// Create: Northstar items the pack takes out (0.4.41, owner's call): its own space suits and oxygen
// blocks only work with Northstar's own air, which is switched off on Ad Astra's planets; Ad Astra's
// suits and Oxygen Distributor do that job. server_scripts/northstar.js removes their recipes and
// JEI entries; here they leave Northstar's creative tabs too.
global.NORTHSTAR_REMOVED = ['iron', 'broken_iron', 'martian_steel']
  .flatMap(m => ['helmet', 'chestpiece', 'leggings', 'boots'].map(p => `northstar:${m}_space_suit_${p}`))
  .concat(['northstar:oxygen_sealer', 'northstar:oxygen_filler', 'northstar:oxygen_detector'])

for (const tab of ['northstar:items', 'northstar:blocks', 'northstar:tech']) {
  StartupEvents.modifyCreativeTab(tab, event => {
    global.NORTHSTAR_REMOVED.forEach(id => event.remove(id))
  })
}
