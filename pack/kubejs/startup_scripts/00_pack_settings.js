// priority: 1000
// Pack-wide settings shared by every script. KubeJS only lets startup scripts write
// to `global`; server and client scripts read these values.
// To rename the pack or move bug reports somewhere else, change it here
// (then restart the game/server: startup scripts do not reload with /reload).

global.PACK = {
  name: 'Project Ages',
  // Keep in step with pack.toml (the bug report form shows it).
  version: '0.7.1',
  // The bug inbox's public form on the pack's website (Desktop\Bug Inbox App on the server), which
  // files each report as an issue in the private GitHub repo BluPhoenix8/Project-Ages-Bugs.
  // In-Game Bug Reports sends its in-game form there (config/ingamebugreports-client.toml); without
  // that mod, /bugreport and the welcome message link players to it.
  bugReportUrl: 'https://mc.cobaltforge.net/form/projectages'
}

// Stage ids used by AStages. A player with no stages is in Age 0.
global.AGES = [
  { stage: 'age_1', title: 'Age I: Bronze', subtitle: 'The crafting table opens the world' },
  { stage: 'age_2', title: 'Age II: Medieval & Ritual', subtitle: 'The world reveals something stranger' },
  { stage: 'age_3', title: 'Age III: The Twilight', subtitle: 'A world with its own ladder' },
  { stage: 'age_4', title: 'Age IV: Steam', subtitle: 'The world suddenly has machinery' },
  { stage: 'age_5', title: 'Age V: Industry', subtitle: 'Electricity and pressure' },
  { stage: 'age_6', title: 'Age VI: Advanced Tech', subtitle: 'Harness the atom' },
  { stage: 'age_7', title: 'Age VII: Space', subtitle: 'Leave the planet' }
]
