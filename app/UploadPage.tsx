import React, {useState, useEffect, useCallback} from 'react'
import { useDropzone } from "react-dropzone";
import {Autocomplete, TextField, Button, Box, Paper, Typography} from '@mui/material'

import {FileUploader} from './components/uploadpage/FileUploader'

import {conductSubmission} from "./components/uploadpage/Uploader";
import {SubmissionMetadata} from "../commonLib/SubmissionMetadata";
import {SubmissionGuidelines} from "./components/uploadpage/SubmissionGuide";

import {mimeMatch} from "../commonLib/MimeType";

// TODO: Need to find a better, global way to do this. Maybe inverse-y can fetch JSON from self instead of using 'fs'
function getAssetUrl(idPath) {
    // console.log('getAssetUrl', {host: location.host, idPath})
    if(location.host.indexOf('localhost') !== -1) {
        return idPath
    }
    return "https://tremho-voices-of-dissent.s3.us-west-1.amazonaws.com/"+idPath
}

function getPassedId() {
    const params = new URLSearchParams(document.location.search)
    let id = params.get("id")?.toLowerCase().trim()
    // console.log("passed Id= "+id)
    return id
}

export default function UploadPage() {
    const [inputs, setInputs]  =  useState({})
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [idInfo, setIdInfo] = useState(null)

    async function asyncUseEffect() {
        if(!idInfo) {
            const id = getPassedId()
            const ir = await fetch(`info/${id}`)
            const info = await ir.json()
            setIdInfo(info)
            console.log("fetched for upload form", {info, idInfo})
        }
    }
    React.useEffect(() => {
        asyncUseEffect()
    })

    // console.log("incoming href=", location.href)
    let ii = location.href.lastIndexOf('?idtbd=')
    let idtbd:string
    if(ii !== -1) {
        idtbd = location.href.substring(ii+7)
    }

    const background:any = {
        backgroundImage: `url(${getAssetUrl('images/vodImage2.png')})`,
        backgroundColor: 'aliceblue',
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        backgroundPosition: "center center",
        height: "110vh",
        width: "100%",
        // position: "absolute",
        zIndex: "-1",
        pointerEffects: "auto"
    }
    const blur:any = {
        // position: "absolute",
        // left: "0",
        // top: "0",
        zIndex: "1",
        backgroundColor: "rgba(201,218,222,0.5)",
        WebkitBackdropFilter: "blur(8px)",
        backdropFilter: "blur(8px)",
        height: "110vh",
        width: "100%",
        pointerEffects: "auto"
    }
    const content:any = {
        pointerEvents: "all",
        zIndex: "2"
    }

    const fieldStyle:any = {

    }
    const inError:any = {
        title: false
    }

    function handleChange(event) {
        const {id, value} = event.target
        // console.log("handle change", {id, value, target:event.target})
        setInputs(values => ({...values, [id]: value}))
    }
    function handleSubmit(event) {
        // console.log("submitting...", {event})
        // console.log("inputs", inputs)
        // console.log("files", {imageFile, audioFile})
        const info:SubmissionMetadata = new SubmissionMetadata()
        info.artistId = getPassedId()
        info.artistName = inputs['name']
        info.title = inputs['title']
        info.description = inputs['desc']
        info.attributions = inputs['attr']
        info.artFile = imageFile
        info.audioFile = audioFile

        conductSubmission(info).then(resp => {
            // console.warn('conductSubmission completes with response', {resp})
            fetch(`/info/${info.artistId}/${info.artistName}`) // update artist name
        })
    }
    function handleUpload(file:File) {
        if(file?.type.startsWith('image/')) setImageFile(file)
        if(file?.type.startsWith('audio/')) setAudioFile(file)
    }
    // function handleImageUpload(files:File[]) {
    //     setImageFile(files[0])
    //     // console.log("Image uploaded", files[0])
    // }
    // function handleAudioUpload(files: File[]) {
    //     setAudioFile(files[0])
    //     // console.log("Audio uploaded", files[0])
    // }

    const slotProps:any = {
        input: { style: { color: "cyan", fontSize: "20px" } },
    }
    const heading:any = {
        color: 'darkblue',
        fontStyle: 'italic'
    }

    let acceptedTypes = 'images/*, audio/*'
    // let acceptedAudioTypes = 'audio/*'
    // const it = []
    // const at = []
    // const mimeObj = mimeMatch as any
    // for(let p of Object.getOwnPropertyNames(mimeObj)) {
    //     let t = mimeObj[p]
    //     if(t.startsWith('image/')) it.push(t)
    //     if(t.startsWith('audio/')) at.push(t)
    // }
    // acceptedImageTypes = it.join(',')
    // acceptedAudioTypes = at.join(',')

    return (
        <>
            <div style={background}>
                <div style={blur}>
                    <SubmissionGuidelines />
                    <div style={content}>
                        <h1>Upload your content!</h1>
                        <Typography style={heading} variant={"h6"}>
                            Please enter the following information about your submission
                        </Typography>
                        <p style={{height:"50px"}}/>
                        <Typography style={heading} variant={"h6"}>Your name to be published</Typography>
                        <form onSubmit={handleSubmit}>
                            <TextField
                                slotProps={slotProps}
                                sx={{
                                    "& .MuiInputLabel-root": { transform: "translate(14px, -6px) scale(0.75)" },
                                }}
                                defaultValue={idInfo?.artistName ?? '' ?? inputs['name'] ?? ''}
                                required={true}
                                error={inError.name}
                                style={fieldStyle}
                                id="name"
                                label="artist name to display"
                                variant="outlined"
                                onChange={handleChange}
                            />
                            <p style={{height:"20px"}}/>
                            <Typography style={heading} variant={"h6"}>Give your creation a title</Typography>
                            <TextField
                                slotProps={slotProps}
                                defaultValue={inputs['title']}
                                required={true}
                                error={inError.title}
                                style={fieldStyle}
                                id="title"
                                label="track title"
                                variant="outlined"
                                onChange={handleChange}
                            />
                            <p style={{height:"20px"}}/>
                            <Typography style={heading} variant={"h6"}>Describe the material and how it came to be</Typography>
                            <TextField
                                slotProps={slotProps}
                                defaultValue={inputs['desc']}
                                required={false}
                                error={inError.desc}
                                style={fieldStyle}
                                id="desc"
                                label="description"
                                variant="outlined"
                                minRows="2"
                                maxRows="8"
                                multiline={true}
                                fullWidth={true}
                                onChange={handleChange}
                            />
                            <p style={{height:"20px"}}/>
                            <Typography style={heading} variant={"h6"}>Give any credits due here, list copyrights, etc</Typography>
                            <TextField
                                slotProps={slotProps}
                                defaultValue={inputs['attr']}
                                required={false}
                                error={inError.attr}
                                style={fieldStyle}
                                id="attr"
                                label="attributions"
                                variant="outlined"
                                minRows="1"
                                maxRows="8"
                                multiline={true}
                                fullWidth={true}
                                onChange={handleChange}
                            />
                            <p style={{height:"20px"}}/>
                            <Typography style={heading} variant={"h6"}>Upload your content files</Typography>
                            <Box sx={{ display: "flex", flexDirection: "column", justifyContent:"center", alignItems:"center", gap: 3 }}>
                                <FileUploader onFileSelect={handleUpload} acceptedTypes={acceptedTypes}  />
                                {/*<FileUpload onFileUpload={handleAudioUpload} acceptedTypes={acceptedAudioTypes} label="Upload Audio File" />*/}
                            </Box>
                        </form>
                        <div style={{ marginTop: "50px", display: "flex", justifyContent: "center" }}>
                            <Button variant={"contained"} onClick={handleSubmit}>Submit your creation!</Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}