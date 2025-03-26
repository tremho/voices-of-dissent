import React, {useEffect, useState} from 'react'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid';
import {SampleCovers} from "./components/mainpage/SampleCovers";
import {SiteImage} from "./components/mainpage/SiteImage";
import {SharePrompt} from "./components/mainpage/SharePrompt";
import {ListenPrompt} from "./components/mainpage/ListenPrompt";
import {AccountControl} from "./components/mainpage/Account";

import React  from 'react'
import { Button } from "@mui/material"
import IDTBD from '@tremho/idtbd'
import {LoadingSpinner} from "./components/LoadingSpinner";



export default function MainPage() {
    const [identity, setIdentity] = useState( null)
    const [status, setStatus] = useState('')
    const [showLoading, setShowLoading] = useState(false)
    const [secrets, setSecrets] = useState(null)
    const [loaded, setLoaded] = useState(false)

    const appId = 'com.tremho.vod'

    function callback(identity) {
        // console.warn('callback called with', identity)
        setLoggedInUser(identity)
    }
    function statusCallback(astatus) {
        // console.log("status", astatus)
        setStatus(astatus)
        if(status) {
            setShowLoading(status === "Processing")
        }
    }

    useEffect( () => {
        if(!secrets) {
            console.log("fetching secrets")
            fetch('/secrets').then(r => {
                r.json().then(s => {
                    // console.log("Setting secrets to ",s)
                    setSecrets(s)
                })
            })
        }
        if(secrets && !identity) {
            console.log("doing IDTBD load")
            // console.log("Secrets used as ", secrets)
            const rapidapikey = secrets.vod.key.rapidapi
            // console.log("rapidapikey=", rapidapikey)
            IDTBD.allowCookie = true
            IDTBD.onLoad(rapidapikey, appId, callback, statusCallback).then(() => {
                console.log("return from onLoad", IDTBD)
                setLoaded(true)
                // setShowLoading(false)
            })
        }
    })

    async function setLoggedInUser(identity:any) {
        console.warn("SetLoggedInUser", identity)
        setIdentity(identity)
        // you can now do what you may need to do for your own app with this identity
        const params = new URLSearchParams(document.location.search)
        // console.log('search params', params)
        let page = params.get("page")?.toLowerCase().trim()
        // console.log("page="+page)
        if(!page) {
            setStatus(undefined)
        }
        setShowLoading(false)


    }

    const loginPlacement:any = {

    }

    function startLogin() {
        // console.log("startLogin")
        setShowLoading(true)
        setTimeout(IDTBD.login, 1000)
    }

    function ready() {
        console.log("ready check", {status, loaded})
        return !status && loaded
    }

    // console.log("showLoading=", showLoading)

    let page
    if(ready()) {
        page = (
            <>
                <LoadingSpinner active={showLoading}/>
                <Grid container spacing={2} sx={{height: "100vh", padding: 2}}>
                    {/* Top Row: Title & Avatar */}
                    <Grid item xs={10}>
                        <Typography variant="h4">Voices of Dissent</Typography>
                    </Grid>
                    <Grid item xs={2} sx={{ display: "flex", justifyContent: "flex-end" }}>
                        <AccountControl login={startLogin} logout={IDTBD.logout} identity={identity} />
                    </Grid>
                    {/* Left Section (3 vertical sections) */}
                    <Grid item xs={12} md={5} container spacing={2} direction="column">
                        <Grid item>
                            <Paper sx={{padding: 2, height: "33%", backgroundColor: "#f5f5f5"}}>
                                {/*<Typography variant="h6">Left Section 1</Typography>*/}
                                <SharePrompt userIdentity={identity?.userIdentity}/>
                            </Paper>
                        </Grid>
                        <Grid item>
                            <Paper sx={{padding: 2}}>
                                {/*<Typography variant="h6">Left Section 2</Typography>*/}
                                <SampleCovers/>
                            </Paper>
                        </Grid>
                        <Grid item>
                            <Paper sx={{padding: 2, backgroundColor: "#bdbdbd"}}>
                                {/*<Typography variant="h6">Left Section 3</Typography>*/}
                                <ListenPrompt/>
                            </Paper>
                        </Grid>
                    </Grid>

                    {/* Right Section (single vertical section) */}
                    <Grid item xs={12} md={7}>
                        <Paper sx={{padding: 2, height: "80%", backgroundColor: "#90caf9"}}>
                            {/*<Typography variant="h6">Right Section</Typography>*/}
                            <SiteImage/>
                        </Paper>
                    </Grid>
                    <p>
                        Voices of Dissent is intended to be a forum where common musicians - amateur, professional,
                        beginner, or seasoned -
                        can share their music in opposition to the actions and policies of the current administration.
                        Songs may be of caution or rebuke, pointing out the many ills of the regime,
                        but may also be beacons of hope and comfort that are sorely needed in these confusing and trying
                        times.
                        <br/>
                        Please Listen -- and please contribute -- LET'S LIFT OUR VOICES TOGETHER!
                    </p>
                </Grid>
            </>
        )
    } else {
        page = (<>
            <LoadingSpinner active={true}/>
        </>)
    }
    return page
}
