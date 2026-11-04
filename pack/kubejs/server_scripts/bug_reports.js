// How players report bugs: /bugreport prints a clickable link to the report form, with the
// pack version and their name already filled in. The address is set in 00_pack_settings.js.

function bugReportLink(player) {
  return `${global.PACK.bugReportUrl}?version=${encodeURIComponent(global.PACK.version)}&player=${encodeURIComponent(player.username)}`
}

function sendBugReportInfo(player) {
  const url = bugReportLink(player)
  player.tell(Text.aqua('> Click here to report a bug').underlined().clickOpenUrl(url).hover(Text.of(url)))
  player.tell(Text.gray('Attach logs/latest.log from your game folder if you can.'))
}

ServerEvents.commandRegistry(event => {
  const { commands: Commands } = event
  event.register(Commands.literal('bugreport').executes(ctx => {
    sendBugReportInfo(ctx.source.playerOrException)
    return 1
  }))
})

PlayerEvents.loggedIn(event => {
  event.player.tell(Text.gray(`Welcome to ${global.PACK.name}. Found a bug? Type `).append(Text.yellow('/bugreport').clickSuggestCommand('/bugreport')))
})
