figma.showUI(__html__);

figma.ui.resize(500, 500);

figma.ui.onmessage = pluginMessage => {

    figma.loadAllPagesAsync()

    const postComponentSet = figma.root.findOne(
        node => node.type == "COMPONENT_SET" && node.name == "post"
    ) as ComponentSetNode
    const defaultVariant = postComponentSet.defaultVariant as ComponentNode
    const defaultDark = figma.root.findOne(
        node => node.type == "COMPONENT" && node.name == "Image=none, Dark mode=true"
    ) as ComponentNode

    // console.log(postComponentSet)
    // console.log(postComponentSet.children)
    // console.log(postComponentSet.name)

    // console.log(pluginMessage.name)
    // console.log(pluginMessage.username)
    // console.log(pluginMessage.description)
    // console.log(pluginMessage.darkModeState)
    // console.log(pluginMessage.imageVariant)

    if (pluginMessage.darkModeState == true) {
        // console.log("welcome to the dark side.")
        defaultDark.createInstance()
    } else {
        // console.log("I'm Mr.LightSide")
        defaultVariant.createInstance()
    }

    // figma.closePlugin()
}