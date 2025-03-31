
import {SubmissionMetadata} from "../../../commonLib/SubmissionMetadata";
import base64 from 'base64-js'

/**
 * Returns the endpoint for the requested function
 * depending upon deployment environment
 * in case host needs to be adjusted
 *
 * @param funcPath -- the relative path
 */
function getLambdaEndpoint(funcPath) {
    // no host adjustment
    return funcPath
}

/**
 * Handles the complete submission process
 *
 * @param info -- the SubmissionMetadata object that contains submission data
 */
export async function conductSubmission(info:SubmissionMetadata, editId?:string) {
    let initPath = '/initiate'
    if(editId) initPath += '/'+editId
    const initUrl = getLambdaEndpoint(initPath)
    console.log("conductSubmissions - Posting to "+(editId?"edit":"start")+" at init url", initUrl)
    console.log("info ", info)
    const eInfo:any = {
        artistId: info.artistId,
        title: info.title,
        description: info.description,
        attributions: info.attributions,
        // I don't know what happened here, but path used to pass through from File, but now not so much...
        artFile: {
            path: (info.artFile as any)?.path ?? info.artFile?.name ?? ''
        },
        audioFile: {
            path: (info.audioFile as any)?.path ?? info.audioFile?.name ?? ''
        }
    }
    console.log("Fetching at "+initUrl)
    const resp:any = await fetch(initUrl, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body:  JSON.stringify(eInfo)
    })
    let data = await resp.json()
    console.log("initiate response ", resp, data)

    const {metaId, artId, audioId} = data

    // upload chunks for art
    console.log("Uploading art file", info.artFile?.name)
    const artUrl = await uploadFileInChunks(info.artFile, artId, metaId+'/art')
    console.log("art url is ", artUrl)
    // upload chunks for audio
    console.log("Uploading audio file", info.audioFile?.name)
    const audioUrl = await uploadFileInChunks(info.audioFile, audioId, metaId+'/audio')
    console.log("audio url is", audioUrl)
    // do final binding
    const bindId = editId ?? metaId
    console.log("doing binding ", {bindId, audioUrl, artUrl})
    const fresp:any = await doFinalBinding(bindId, info.artistName, audioUrl, artUrl)
    console.log("response from final", fresp)

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

    console.log(`Starting upload of ${totalChunks} chunks`)
    for(let chunkIndex=0; chunkIndex<totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);
        const chunkArrayBuffer = await chunk.arrayBuffer();
        // const chunkBase64 = Buffer.from(chunkArrayBuffer).toString("base64")
        const chunkUint8Array = new Uint8Array(chunkArrayBuffer);
        const chunkBase64 = base64.fromByteArray(chunkUint8Array)
        const chunkUrl = getLambdaEndpoint(`/chunk/${uploadId}/${fk}/${chunkIndex}`)

        const resp:any = await fetch(chunkUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                base64: chunkBase64,
                chunkIndex,
                totalChunks
            })
        });
        console.log(`chunk index ${chunkIndex} uploaded size ${chunkBase64.length}`)
    }
    console.log("done uploading... now doing completion")

    // now complete it
    const completeUrl = getLambdaEndpoint(`/complete/${uploadId}/${fk}`)
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

    const finalUrl = getLambdaEndpoint('/finalize')
    const resp:any = await fetch(finalUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({metaId, artistName, audioUrl, artUrl})
    })
    return await resp.json()
}