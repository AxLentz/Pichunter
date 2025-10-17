figma.showUI(__html__);

figma.ui.resize(320, 640);

function send2UI(imgData: Uint8Array) {
    console.log(`Sending image data of size: ${imgData.length} bytes`)
    figma.ui.postMessage({ type: 'exportImage', data: imgData })
}

figma.on('selectionchange', () => {
    const selection = figma.currentPage.selection
    if (selection.length === 1 && selection[0].type === 'RECTANGLE') {
        let selectNode = selection[0]
        selectNode.exportAsync({
            format: "PNG",
            constraint: {
                type: "SCALE",
                value: 0.3,
            }
        }).then(
            resolved => {
                send2UI(resolved)
            },
            rejected => {
                console.error(rejected)
            }
        )
    }
})

