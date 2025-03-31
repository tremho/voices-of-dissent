import React, {useEffect, useState} from "react"
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TableSortLabel, Checkbox, Paper, Avatar, TextField, InputAdornment,
    Grid, Paper, Typography
} from "@mui/material"
import SearchIcon from "@mui/icons-material/Search"

import {TrackData} from '../commonLib/TrackData'
import {MusicTable} from "./components/listenpage/MusicTable"
import {NowPlaying} from "./components/listenpage/NowPlaying"
import {TrackInfo} from "./components/listenpage/TrackInfo"

let reported:any
function reportBack(n:any) {
    reported = n
    // console.warn("reported", {reported})

}

export default function ListenPage(props:any) {
    const [trackData, setTrackData] = useState<TrackData[]>([])
    const [identity,setIdentity] = useState(getPassedId())
    const [selectedData, setSelectedData] = useState<TrackData>(props.selectedData)

    function advanceRow() {
        // console.warn("sanity check called", {reported})
        reported?.advanceToNextRow()
    }

    function getPassedId() {
        const params = new URLSearchParams(document.location.search)
        let id = params.get("id")?.toLowerCase().trim()
        console.log("ListenPage was passed Id= "+id)
        return id
    }
    function getPassedTrackRef() {
        const params = new URLSearchParams(document.location.search)
        let ref = params.get("ref")?.toLowerCase().trim()
        return ref

    }

    useEffect(() => {
        if(!trackData?.length) {
            // console.log('fetching tracks')
            fetch('/tracks/').then(async resp => {
                const data = await resp.json()
                // console.log(`${data.length} tracks returned`, {data})
                setTrackData(data)
                // console.log("tracks set", {trackData})
            })

        }
    })
    // console.log(">> tracks set", {trackData})
    return(
        <>
            <h1>Voices of Dissent</h1>

            <Grid container spacing={2} sx={{ p: 2 }}>
                {/* Top Sections */}
                <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, minHeight: 150 }}>
                    <MusicTable ref={getPassedTrackRef()} data={trackData} identity={getPassedId()} setSelectedData={setSelectedData}  reportBack={reportBack} />
                </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, minHeight: 150 }}>
                    <NowPlaying doAdvanceRow={advanceRow} selectedData={selectedData}/>
                </Paper>
                </Grid>

            {/* Bottom Sections */}
                <Grid item xs={12} md={6}>
                    {/*<Paper sx={{ p: 2, minHeight: 200 }}>*/}
                    {/*    <div style={{width:"50%"}}>*/}
                    {/*        Possible future home of comments*/}
                    {/*    </div>*/}
                    {/*</Paper>*/}
                </Grid>
                <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, minHeight: 200 }}>
                    <TrackInfo identity={getPassedId()} selectedData={selectedData}/>
                </Paper>
                </Grid>
            </Grid>
            </>
        )
}


