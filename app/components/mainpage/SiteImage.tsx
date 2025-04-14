import React from 'react'
import {getAssetUrl} from "../../../commonLib/ServiceEndpoint";

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