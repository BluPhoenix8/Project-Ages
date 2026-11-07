// "Chat messages can't be verified": Minecraft shows it when a server doesn't check signed chat.
// Servers behind a proxy (one address for two servers, like the Test Server's) can't: the proxy
// vouches for players instead of Mojang, so the warning came up on every join and every switch
// between servers. Chat works the same either way, so the warning is hidden (owner, 2026-11-05:
// "Can we get rid of that?"). If Minecraft's names ever change, this says so in the log once
// and stops; nothing shows in game.

var paChatWarningHide = null
try {
  var $PaSystemToast = Java.loadClass('net.minecraft.client.gui.components.toasts.SystemToast')
  var paUnsecureToast = Java.loadClass('net.minecraft.client.gui.components.toasts.SystemToast$SystemToastId').UNSECURE_SERVER_WARNING
  if (paUnsecureToast) paChatWarningHide = () => $PaSystemToast.forceHide(Client.getToasts(), paUnsecureToast)
  else console.warn("Can't hide the chat warning: no UNSECURE_SERVER_WARNING toast id")
} catch (e) {
  console.warn(`Can't hide the chat warning: ${e}`)
}

ClientEvents.tick(event => {
  if (paChatWarningHide == null) return
  try {
    paChatWarningHide()
  } catch (e) {
    console.warn(`Can't hide the chat warning: ${e}`)
    paChatWarningHide = null
  }
})
