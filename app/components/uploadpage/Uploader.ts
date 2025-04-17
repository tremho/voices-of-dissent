
import {SubmissionMetadata} from "../../../commonLib/SubmissionMetadata";
import base64 from 'base64-js'
import ServiceEndpoint from "../../../commonLib/ServiceEndpoint";

import debugTheProblem from './DebugProblem'

/**
 * Handles the complete submission process
 *
 * @param info -- the SubmissionMetadata object that contains submission data
 */
export async function conductSubmission(info:SubmissionMetadata, editId?:string) {

    let initPath = '/upstart/'
    if(editId) initPath += editId
    else initPath += 'undefined/undefined'
    const initUrl = ServiceEndpoint(initPath)
    console.log("conductSubmissions - Posting to "+(editId?"edit":"start")+" at init url", initUrl)
    console.log("info ", info)
    // alert("Pause before even starting")
    const eInfo:any = {
        artistId: info.artistId,
        title: info.title,
        description: info.description,
        attributions: info.attributions,
        // I don't know what happened here, but path used to pass through from File, but now not so much... use name instead
        artFile: {
            path: (info.artFile as any)?.path ?? info.artFile?.name ?? ''
        },
        audioFile: {
            path: (info.audioFile as any)?.path ?? info.audioFile?.name ?? ''
        },
        artUrl: (info as any).artUrl,
        audioUrl: (info as any).audioUrl
    }
    console.log("Fetching init at "+initUrl)
    console.log("einfo", JSON.stringify(eInfo,null,2))
    console.log("file info", info.audioFile as any)
    // alert("Pause 2")
    let data:any = {}

    try {
        const resp = await fetch(initUrl, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain", // json will blow us up for some reason
                "Cache-Control": "no-store",
                "Connection": "close"
            },
            body: JSON.stringify(eInfo)
        });
        console.log("Fetch completed", resp);
        data = await resp.text()
        if(typeof data === 'string') data = JSON.parse(data)
        console.log("data retrieved: ", data)

    } catch(e:any) {
        console.error("----- Looks like we blew up here -----")
        console.error("Full error object:", e);
        console.error("error.name:", e.name);
        console.error("error.code:", e.code);
        console.error("error.stack:", e.stack);
        console.error("initUrl is "+initUrl)
        console.error(">>> at upload start fetch: ", e)
    }
    console.log("initiate response data", data)
    // alert("Pause 3")

    let {metaId, artId, audioId} = data
    if(editId) metaId = editId

    if(metaId) console.log("metaId is "+metaId)
    else {
        throw new Error("No META in upload process")
    }

    // alert("Pause after starting init")

    // upload chunks for art
    console.log("Uploading art file", info.artFile?.name)
    const artUrl = await uploadFileInChunks(info.artFile, artId, metaId+'/art')
    console.log("+>+>+>+>+>+>> art url is ", artUrl)
    // alert("pausing after art upload")
    // upload chunks for audio
    console.log("Uploading audio file", info.audioFile?.name)
    const audioUrl = await uploadFileInChunks(info.audioFile, audioId, metaId+'/audio')
    console.log("+>+>+>+>+>+>> audio url is", audioUrl)
    // alert("pausing after audio upload")
    // do final binding
    const bindId = metaId
    console.log("doing binding ", {bindId, audioUrl, artUrl})
    console.log("final artist name ", info.artistName)
    const fresp:any = await doFinalBinding(bindId, info.artistName, audioUrl, artUrl)
    console.log("response from final", fresp)
    // alert("pause to take this in")
    return fresp

}

/**
 * Uploads a file to an established uploadId by doing so in multiple 5MB chunks
 *
 * @param file  -- the File object for the file to be transferred
 * @param uploadId  -- the established uploadId (see initiate)
 * @param fileKey   -- the fileKey the asset is stored under (bucket was already established via uploadId, but we need filekey again, apparently)
 */
async function uploadFileInChunks(file:File, uploadId:string, fileKey:string) : Promise<string|undefined> {

    if(!file?.name) return undefined

    const CHUNK_SIZE = 5 * 1024 * 1024 // chunks must be >=5<6 MB with base64 5MB could be 6.66 MB... we'll see...
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)

    const fk = fileKey.replace('/', ':').replace('/', ':') // There are two

    console.log("values", {uploadId, fileKey, fk, totalChunks, name:file?.name})

    console.log(`Starting upload of ${totalChunks} chunks`)
    for(let chunkIndex=0; chunkIndex<totalChunks; chunkIndex++) {
            const chunkUrl = ServiceEndpoint(`/chunk/${uploadId?uploadId:'~'}/${fk?fk:'~'}/${chunkIndex}`)
            const start = chunkIndex * CHUNK_SIZE
            const end = Math.min(start + CHUNK_SIZE, file.size);
            const chunk = file.slice(start, end);
            const chunkArrayBuffer = await chunk.arrayBuffer();
            // const chunkUint8Array = new Uint8Array(chunkArrayBuffer);

        console.log("fetching chunk @ ", chunkUrl)
        console.log("with", {uploadId, fk, chunkIndex, totalChunks})
        const range = end-start
        console.log("sizes", {range, CHUNK_SIZE})
        const resp:any = await fetch(chunkUrl, {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: chunkArrayBuffer
        });
        console.log(`chunk index ${chunkIndex} uploaded size ${chunkArrayBuffer.byteLength}`)
    }
    console.log("done uploading... now doing completion")

    // now complete it
    const completeUrl = ServiceEndpoint(`/complete/${uploadId}/${fk}`)
    const resp:any = await fetch(completeUrl)
    const data = await resp.json()
    console.log("return from complete", {data})
    return data.url
}

/**
 * Once files have been uploaded and their urls collected, we call this to bind the results together into the top-level information object
 *
 * @param metaId    -- the top-level object identifier (object key within tremho-vod-data bucket)
 * @param audioUrl  -- the url for the audio asset to record
 * @param artUrl    -- the url for the cover art asset to record
 */
async function doFinalBinding(metaId:string, artistName:string, audioUrl?:string, artUrl?:string) {

    const finalUrl = ServiceEndpoint('/finalize')
    console.log("fetching final @ ", finalUrl)
    const resp:any = await fetch(finalUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({metaId, artistName, audioUrl, artUrl})
    })
    return await resp.json()
}