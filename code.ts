figma.showUI(__html__);

figma.ui.resize(500, 500);

figma.ui.onmessage = pluginMessage => {
    console.log(pluginMessage.name)
    console.log(pluginMessage.username)
    console.log(pluginMessage.description)
    console.log(pluginMessage.darkModeState)
    console.log(pluginMessage.imageVariant)

    figma.closePlugin()
}