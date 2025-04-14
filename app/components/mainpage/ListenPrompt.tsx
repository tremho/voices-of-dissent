import React from 'react'

import {Button} from '@mui/material'
import ServiceEndpoint from "../../../commonLib/ServiceEndpoint";


let userIdentity = ''

function goListen() {
    // console.log("Oh, Oh, Oh... Listen to the music")
    location.href=ServiceEndpoint('/?page=listen&id='+(userIdentity ?? ''))
}

export function ListenPrompt(props) {
    userIdentity = props.userIdentity
    return (
        <>
            <Button variant={"contained"} onClick={goListen}>Hear the voices</Button>
            <p>
                <br/>
                Need a soundtrack for the times we are experiencing to help you get through the day? Look no futher.
                <br/>
                Play a continuous playlist of content from this site, or get links to share for individual tracks.
            </p>
        </>

    )

}