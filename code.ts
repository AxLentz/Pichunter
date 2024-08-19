figma.showUI(__html__);

figma.ui.resize(500, 500);

figma.ui.onmessage = pluginMessage => {

    figma.loadAllPagesAsync()

    const postComponentSet = figma.root.findOne(
        node => node.type == "COMPONENT_SET" && node.name == "post"
    ) as ComponentSetNode

    let selectedVariant

    console.log(pluginMessage.imageVariant)

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
        switch (pluginMessage.imageVariant) {
            case "single img":
                selectedVariant = postComponentSet.findOne(
                    node => node.type == "COMPONENT" && node.name == "Image=single, Dark mode=true"
                ) as ComponentNode
                break
            case "carousel":
                selectedVariant = postComponentSet.findOne(
                    node => node.type == "COMPONENT" && node.name == "Image=carousel, Dark mode=true"
                ) as ComponentNode
                break
            default:
                selectedVariant = postComponentSet.findOne(
                    node => node.type == "COMPONENT" && node.name == "Image=none, Dark mode=true"
                ) as ComponentNode
                break
        }
    } else {
        // console.log("I'm Mr.LightSide")
        switch (pluginMessage.imageVariant) {
            case "single img":
                selectedVariant = postComponentSet.findOne(
                    node => node.type == "COMPONENT" && node.name == "Image=single, Dark mode=false"
                ) as ComponentNode
                break
            case "carousel":
                selectedVariant = postComponentSet.findOne(
                    node => node.type == "COMPONENT" && node.name == "Image=carousel, Dark mode=false"
                ) as ComponentNode
                break
            default:
                selectedVariant = postComponentSet.defaultVariant as ComponentNode
                break
        }
    }

    selectedVariant.createInstance()

    // figma.closePlugin()
}