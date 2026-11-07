// Shaders in space (owner, 0.5.0 test 9: "complementary was the issue, the other shader works fine").
// Complementary draws every modded world with its Overworld program, which turns anything textured
// below the horizon black, so Ad Astra's planet under an orbit came out as a black shape in grey haze.
// No setting changes that, and its licence forbids shipping it changed. MakeUp draws the planet as it
// is. So while you're in an orbit with Complementary on, the game switches to MakeUp, and back to
// Complementary when you leave: a few seconds' pause each way while the shaders load. Another pack,
// or shaders off, is left alone. The switch is noted in a small file, so quitting the game in orbit
// still brings Complementary back next time.

const $PaSpaceIris = Java.loadClass('net.irisshaders.iris.Iris')
const PA_SPACE_PACK = 'MakeUp-UltraFast-9.6.zip' // the file in shaderpacks/: change it when MakeUp updates
const PA_SPACE_FROM = 'ComplementaryReimagined'
const PA_SPACE_NOTE = 'config/projectages-space-shaders.json'
const PA_SPACE_ORBITS = ['ad_astra:earth_orbit', 'ad_astra:moon_orbit', 'ad_astra:mars_orbit',
  'ad_astra:venus_orbit', 'ad_astra:mercury_orbit', 'ad_astra:glacio_orbit']

var paSpaceDim = null     // the world this was last checked in
var paSpaceFailed = false // stop after an error instead of trying every tick

function paSpaceNote() {
  try {
    var note = JsonIO.read(PA_SPACE_NOTE) // a Java Map, or null without the file
    var from = note ? note.get('from') : null
    return from ? String(from) : null
  } catch (e) {
    return null
  }
}

function paSpaceSetNote(from) {
  try {
    JsonIO.write(PA_SPACE_NOTE, from ? { from: from } : {})
  } catch (e) {
    console.warn(`Space shaders: couldn't save the note: ${e}`)
  }
}

// Changes the shader pack the way Iris's own shader screen does. With shaders off, only the
// choice changes; the pack loads when shaders are turned back on.
function paSpaceUse(config, pack, text) {
  config.setShaderPackName(pack)
  config.save()
  if (config.areShadersEnabled()) {
    $PaSpaceIris.reload()
    Client.player.setStatusMessage(Text.gray(text))
  }
}

ClientEvents.tick(event => {
  if (paSpaceFailed || !Client.level || !Client.player || Client.screen != null) return
  var dim = String(Client.level.dimension)
  if (dim == paSpaceDim) return
  paSpaceDim = dim
  try {
    var config = $PaSpaceIris.getIrisConfig()
    var pack = config.getShaderPackName().orElse('')
    var from = paSpaceNote()
    if (PA_SPACE_ORBITS.indexOf(dim) >= 0) {
      if (from == null && config.areShadersEnabled() && pack.startsWith(PA_SPACE_FROM)
        && $PaSpaceIris.isValidShaderpack($PaSpaceIris.getShaderpacksDirectory()['resolve(java.lang.String)'](PA_SPACE_PACK))) {
        paSpaceSetNote(pack)
        paSpaceUse(config, PA_SPACE_PACK, 'MakeUp shaders in orbit')
      }
    } else if (from != null) {
      paSpaceSetNote(null)
      if (pack == PA_SPACE_PACK) paSpaceUse(config, from, 'Back to Complementary shaders')
    }
  } catch (e) {
    paSpaceFailed = true
    console.error(`Space shaders: ${e}`)
  }
})
