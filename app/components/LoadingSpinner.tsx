import React from 'react'
import {getAssetUrl} from "../../commonLib/ServiceEndpoint";

const overlay:any = {
    position:"absolute",
    width:"100vw",
    height: "100vh",
    zIndex: "999",
    paddingTop: "30%",
    paddingLeft: "45%",
    backgroundColor: "rgba(128,160,200,0.8)"
}
export function LoadingSpinner(props) {
    if(props.active) {
        return (
            <>
                <div style={overlay}>
                    <img src={getAssetUrl("images/blue_spinner.gif")}/>
                </div>
            </>
        )
    }
    return (<></>)
}