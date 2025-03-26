import React from 'react'


// TODO: Need to find a better, global way to do this. Maybe inverse-y can fetch JSON from self instead of using 'fs'
function getAssetUrl(idPath) {
    // console.log('getAssetUrl', {host: location.host, idPath})
    if(location.host.indexOf('localhost') !== -1) {
        return idPath
    }
    return "https://tremho-voices-of-dissent.s3.us-west-1.amazonaws.com/"+idPath
}

const coverSize = 200

const coverCommon:any = {
    position: "relative",
    width: coverSize+"px",
    height: coverSize+"px",
    backgroundSize: "contain",
    border: "1 solid black"
}

const container:any = {
    backgroundColor: "pink",
    height:"220px"
}


export function SampleCovers(props:any) {
    const covers = []
    for (let i=0; i<3; i++) {
        let img = getAssetUrl(`images/placeholder-cover-${i+1}.png`)
        const cover = Object.assign({},coverCommon)
        cover.backgroundImage = `url(${img})`
        const r = Math.floor(Math.random() * 60) - 30
        cover.rotate = r+'deg'
        const d = Math.floor(Math.random() * 50) - 20
        cover.top = (i * -coverSize) + d + 'px'
        const off = Math.floor(Math.random() * coverSize/5)
        cover.left = (i * coverSize -off) + 'px'
        covers.push(cover)
    }
    return (
        <>
            <div style={container}>
            <div style={covers[0]}/>
            <div style={covers[1]}/>
            <div style={covers[2]}/>
            </div>
        </>
    )
}

