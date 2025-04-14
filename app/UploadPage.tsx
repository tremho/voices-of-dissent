import ServiceEndpoint from "../commonLib/ServiceEndpoint";

console.log("-------------loading UploadPage-----------")
import React, {useState, useEffect, useCallback} from 'react'
import { useDropzone } from "react-dropzone";
import {Autocomplete, TextField, Button, Box, Paper, Typography} from '@mui/material'

import {FileUploader} from './components/uploadpage/FileUploader'

import {conductSubmission} from "./components/uploadpage/Uploader";
import {SubmissionMetadata} from "../commonLib/SubmissionMetadata";
import {SubmissionGuidelines} from "./components/uploadpage/SubmissionGuide";

import {mimeMatch} from "../commonLib/MimeType";
import {LoadingSpinner} from "./components/LoadingSpinner";
import {getAssetUrl} from "../commonLib/ServiceEndpoint";

function getPassedId() {
    const params = new URLSearchParams(document.location.search)
    let id = params.get("id")?.toLowerCase().trim()
    // console.log("passed Id= "+id)
    return id
}

function getEditId() {
    const params = new URLSearchParams(document.location.search)
    let edit = params.get("edit")?.toLowerCase().trim()
    if (edit) {
        let id = params.get("id")?.toLowerCase().trim()
        return id + '/' + edit
    }
    return ''
}

export default function UploadPage() {
    // console.log("Entering UploadPage")
    const [inputs, setInputs]  =  useState({})
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [audioFile, setAudioFile] = useState<File | null>(null)
    const [idInfo, setIdInfo] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [editId, setEditId] = useState(getEditId())
    const [editFetched, setEditFetched] = useState(false)
    const [editArtUrl, setEditArtUrl] = useState('')
    const [editAudioUrl, setEditAudioUrl] = useState('')

    // console.log("UploadPage 2")

    async function asyncUseEffect() {
        // console.log("UploadPage asyncUseEffect", {idInfo, editId, editFetched})
        if(!idInfo) {
            const id = getPassedId()
            console.log("Upload Page Fetching info/"+id);
            const ir = await fetch(ServiceEndpoint(`/info/${id}/undefined/undefined`))
            const info = await ir.json()
            console.log("received info ", info)
            if(info.artistName === 'undefined') info.artistName = ''
            console.log("realized info ", info)
            setIdInfo(info)
            console.log("fetched for upload form", {info, idInfo})
        }
        if(editId && !editFetched) {
            console.log("getting edit info for "+editId)
            const er = await fetch(ServiceEndpoint(`/tracks/${editId}`))
            const info = await er.json()
            console.log("edit info returned ", info)
            console.log("edit info as json ", JSON.stringify(info))
            setEditFetched(true)
            const values = {
                name: info.artistName,
                title: info.title,
                desc: info.description,
                attr: info.attributions
            }
            setInputs(values)
            console.log("assets urls ", {art: info.artUrl, audio: info.audioUrl})
            if(info.artUrl) setEditArtUrl(info.artUrl)
            if(info.audioUrl) setEditAudioUrl(info.audioUrl)
            console.log("inputs set to values ", values)
        }
        // console.log("done with asyncUseEffect")
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
        console.log("submitting...")
        console.log("inputs", inputs)
        console.log("files", {imageFile, audioFile})

        if(editId) {
            console.warn("Submitting an edit update for "+editId)
        }

        function pick(name) {
            const idany:any = idInfo as any
            return idany[name] ?? inputs[name]
        }
        setUploading(true)
        const info:SubmissionMetadata = new SubmissionMetadata()
        info.artistId = getPassedId()
        info.artistName = pick('name') ?? pick('artistName')
        info.title = pick('title')
        info.description = pick('desc')
        info.attributions = pick('attr')
        info.artFile = imageFile
        info.audioFile = audioFile

        if(inputs['name']) info.artistName = inputs['name']

        if(!info.artistName) {
            setUploading(false)
            alert('you must include a value for artist name')
            return
        }
        if(!info.title) {
            setUploading(false)
            alert('you must include a title for the content')
            return
        }
        if(!info.audioFile && !editId) {
            setUploading(false)
            alert("you didn't attach an audio file for your content!")
            return
        }
        if(inputs['name']) info.artistName = inputs['name']
        console.warn('calling conductSubmission now')
        console.log("with info ", info)
        console.log("and editId ", editId)
        conductSubmission(info, editId).then(resp => {
            // console.warn('conductSubmission completes with response', {resp})
            console.log(`writing artistName via /info/${info.artistId}/${info.artistName}`)
            fetch(ServiceEndpoint(`/info/${info.artistId}/${info.artistName}/~`)).then((fresp) => {
                fresp.json().then(data => {
                    setUploading(false)
                    if(editId) {
                        // alert('update complete!')
                        location.href = ServiceEndpoint('/?page=listen&id='+getPassedId()+"&ref="+editId)
                    } else {
                        console.log("data from info: ", data)
                        // alert('upload complete! data.metaId="'+resp.metaId+'"')
                        location.href = ServiceEndpoint('/?page=listen&id='+getPassedId()+"&ref="+resp.metaId)
                    }
                })
            })
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

    function goHome() {
        location.href = ServiceEndpoint('/')
    }

    // console.log("UploadPage rendering")
    return (
        <>
            <div style={background}>
                <div style={blur}>
                    <LoadingSpinner active={uploading}/>
                    <SubmissionGuidelines active={editId ? false : true}/>
                    <div style={content}>
                        <h1 style={{cursor:"hand"}} onClick={goHome}>
                            {editId ? "Update Your Content" : "Enter Your Submission!"}
                        </h1>
                        <Typography style={heading} variant={"h6"}>
                            Please enter the following information about your submission
                        </Typography>
                        <p style={{height:"20px"}}/>
                        <Typography style={heading} variant={"h6"}>Your name to be published</Typography>
                        <form onSubmit={handleSubmit}>
                            <TextField
                                slotProps={slotProps}
                                sx={idInfo?.artistName ? {
                                    "& .MuiInputLabel-root": { transform: "translate(14px, -6px) scale(0.75)" },
                                } : {}}
                                defaultValue={idInfo?.artistName ?? '' ?? inputs['name'] ?? ''}
                                required={true}
                                error={inError.name}
                                style={fieldStyle}
                                id="name"
                                label="artist name to display"
                                variant="outlined"
                                onChange={handleChange}
                            />
                            <p style={{height:"10px"}}/>
                            <Typography style={heading} variant={"h6"}>Give your creation a title</Typography>
                            <TextField
                                slotProps={slotProps}
                                sx = {inputs['title'] ? {"& .MuiInputLabel-root": { transform: "translate(14px, -6px) scale(0.75)" }} : {}}
                                defaultValue={inputs['title']}
                                required={true}
                                error={inError.title}
                                style={fieldStyle}
                                id="title"
                                label="track title"
                                variant="outlined"
                                onChange={handleChange}
                            />
                            <p style={{height:"10px"}}/>
                            <Typography style={heading} variant={"h6"}>Describe the material and how it came to be</Typography>
                            <TextField
                                slotProps={slotProps}
                                sx = {inputs['desc'] ? {"& .MuiInputLabel-root": { transform: "translate(14px, -6px) scale(0.75)" }} : {}}
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
                            <p style={{height:"10px"}}/>
                            <Typography style={heading} variant={"h6"}>Give any credits due here, list copyrights, etc</Typography>
                            <TextField
                                slotProps={slotProps}
                                sx = {inputs['attr'] ? {"& .MuiInputLabel-root": { transform: "translate(14px, -6px) scale(0.75)" }} : {}}
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
                            <p style={{height:"10px"}}/>
                            <Typography style={heading} variant={"h6"}>Upload your content files</Typography>
                            <Box sx={{ marginTop: "10px", display: "flex", flexDirection: "column", justifyContent:"center", alignItems:"center", gap: 3 }}>
                                <FileUploader
                                    editArtUrl={editArtUrl}
                                    editAudioUrl={editAudioUrl}
                                    onFileSelect={handleUpload}
                                    acceptedTypes={acceptedTypes}
                                />
                                {/*<FileUpload onFileUpload={handleAudioUpload} acceptedTypes={acceptedAudioTypes} label="Upload Audio File" />*/}
                            </Box>
                        </form>
                        <div style={{ marginTop: "30px", display: "flex", justifyContent: "center" }}>
                            <Button variant={"contained"} onClick={handleSubmit}>{
                                editId ? "Update Your Content" : "Submit Your Creation!"
                            }</Button>
                        </div>
                        <DeleteContent />
                    </div>
                </div>
            </div>
        </>
    )
}

function handleDelete() {
    const editId = getEditId()
    console.warn("Deleting "+editId)
    fetch(ServiceEndpoint('/delete/'+editId), {method:"DELETE"}).then(() =>{

        console.log("returned from delete")
        // alert('content deleted!')
        location.href = ServiceEndpoint('/?page=listen&id='+getPassedId())

    })
}

function DeleteContent(props) {
    if(getEditId()) { // only show if we are editing
        return (
            <>
                <div style={{marginTop: "15px", display: "flex", justifyContent: "center"}}>
                    <Button variant={"contained"} onClick={handleDelete}>Delete this submission</Button>
                </div>
            </>
        )
    }
}