import React from 'react'

// TODO: Need to find a better, global way to do this. Maybe inverse-y can fetch JSON from self instead of using 'fs'
function getAssetUrl(idPath) {
    // console.log('getAssetUrl', {host: location.host, idPath})
    if(location.host.indexOf('localhost') !== -1) {
        return idPath
    }
    return "https://tremho-voices-of-dissent.s3.us-west-1.amazonaws.com/"+idPath
}

const siteDiv:any = {
    backgroundImage: `url(${getAssetUrl('images/vodImage.jpeg')})`,
    backgroundSize: "contain",
    width:"100%",
    height:"100%",
    backgroundRepeat: "no-repeat"
}

export function SiteImage() {

    return (
        <div style={siteDiv} />
    )

}