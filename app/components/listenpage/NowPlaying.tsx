import React from 'react'

const npLayout:any = {
    display:"flex",
    justifyContent:"center",
    alignItems: "center"
}

const npContainer:any = {
    width:"420px",
    height:"420px",
    display:"flex",
    flexDirection: "column",
    justifyContent:"center",
    alignItems: "center"
}

let advanceRowHandler: any

export function NowPlaying(props) {
    console.log("NowPlaying", {props})
    const audioUrl = props.selectedData?.audioUrl ?? null
    const imageUrl = props.selectedData?.artUrl ?? null

    if(props.doAdvanceRow) {
        advanceRowHandler=props.doAdvanceRow
        console.log("advanceRowHandler set", advanceRowHandler)
    }

    setTimeout(attachListeners, 1000)
    return (
        <>
            <div style={npLayout}>
                <div style={npContainer}>
                    <img src={imageUrl} width="380" height="380"/>
                    <audio controls id="vod-audio-player" src={audioUrl}/>
                </div>
            </div>
        </>
    )
}

function attachListeners() {
    const el = document.getElementById('vod-audio-player')
    const events = ['audioprocess', 'canplay', 'canplaythrough', 'complete', 'durationchange', 'emptied',
    'ended', 'loadeddata', 'loadedmetadata', 'loadstart', 'pause', 'play', 'playing', 'ratechange', 'seeked', 'seeking',
    'stalled', 'suspend', 'timeupdate', 'volumechange', 'waiting']
    for (let e of events) {
        el.addEventListener('ended', onAudioEvent)
    }
}

function onAudioEvent(event) {
    console.log("audio event seen", {type: event.type, target: this})
    if(event.type === 'ended') {
        console.log("calling advanceRowHandler", advanceRowHandler)
        advanceRowHandler()
    }
}

let playing = false

