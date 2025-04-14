import React, {useState} from 'react'

import {Button} from '@mui/material'
import Typography from '@mui/material/Typography'
import ServiceEndpoint from "../../../commonLib/ServiceEndpoint";


function LoginRequired() {
    const alertDiv:any = {
        width:"500px",
        height:"175px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    }
    const wordingDiv:any = {
    }
    return (
        <>
            <div style={alertDiv}>
                <div style={wordingDiv}>
                    <Typography variant="h6">
                        You must be logged in before submitting content
                    </Typography>
                </div>
            </div>
        </>
    )
}

export function SharePrompt(props) {
    // console.log('SharePrompt props', props)
    const [identity, setIdentity] = useState(props.userIdentity)
    const [showAlert, setShowAlert] = useState(false)

    function goUpload() {
        if(!identity) {
            // TODO: You must be logged in
            setShowAlert(true)
        } else {
            location.href = ServiceEndpoint('/?page=upload&id='+props.userIdentity)
        }
    }

    if(showAlert) return LoginRequired()

    return (
        <>
        <Typography variant={"h6"}>Welcome to Voices of Dissent!</Typography>
        <p>
            This site is dedicated to the sharing of music, poetry, and other creative audio media contributed by users.
            <br/>
            If you are a musician and can record a performance of either an original or a licensed cover song that captures a spirit of resistance, or a thread of hope, or a reminder of humanity then please contribute to this collection.
            <br/>
            If you prefer poetry, or similar lyrical recitals, share that. The idea is to express ourselves and our feelings with audio content.
            <br/>
        </p><br/>
        <Button variant={"contained"} onClick={goUpload}>Share your voice</Button>
        </>

    )

}