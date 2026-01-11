
import {SubmissionMetadata} from "../../../commonLib/SubmissionMetadata";
import base64 from 'base64-js'
import ServiceEndpoint from "../../../commonLib/ServiceEndpoint";
import fs from "fs";
import {getMimeType} from "../../../commonLib/MimeType";




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
        console.error("Failed to init upload", e)
    }
    console.log("initiate response data", data)
    // alert("Pause 3")

    let {metaId} = data
    if(editId) metaId = editId

    if(metaId) console.log("metaId is "+metaId)
    else {
        throw new Error("No META in upload process")
    }

    // get artFile name and metaId
    // upload and get url back
    let artUrl = ''
    let audioUrl = ''
    if(info.artFile?.name) {
        artUrl = await multistageFileUpload(info.artFile, metaId)
    }
    //get audioFile name and metaId
    // upload and get url back
    if(info.audioFile?.name) {
        audioUrl = await multistageFileUpload(info.audioFile, metaId)
    }

    // do final binding
    const bindId = metaId
    console.log("doing binding ", {bindId, audioUrl, artUrl})
    console.log("final artist name ", info.artistName)
    const fresp:any = await doFinalBinding(bindId, info.artistName, audioUrl, artUrl)
    console.log("response from final", fresp)
    //alert("pause to take this in")
    return fresp

}

/**
 *
 */
async function multistageFileUpload(file:File, contentId:string):Promise<string> {

    const fileName = file.name ?? (file as any).path ?? ''
    const mimeType = getMimeType(fileName)

    const chunkSize = 1024 * 1024

    const postJson = async (url:string, data:any) => {
        const resp = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (!resp.ok) {
            throw new Error(`HTTP Error ${resp.status}: ${await resp.text()}`);
        }
        return await resp.json();
    }

    // Step 1: XferBegin
    console.log('Calling XferBegin...', {fileName, contentId});
    const beginUrl = ServiceEndpoint('/xferbegin')
    const beginResp = await postJson(beginUrl, {
        fileName,
        contentId
    });
    const id = (beginResp as any).id; // the id returned
    console.log(`Received transfer id: ${id}`);

    // Step 2: XferChunk
    console.log('Uploading chunks...');
    const fileBytes = file.size
    const totalChunks = Math.ceil(fileBytes / chunkSize);
    console.log("sizes at start", {fileBytes, totalChunks})
    for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(fileBytes, (i + 1) * chunkSize);
        const chunk = await file.slice(start,end).arrayBuffer()
        const b64data = base64.fromByteArray(new Uint8Array<ArrayBufferLike>(chunk))
        console.log("chunk sizes ", {
            chunkSize: chunk.byteLength,
            b64Size: b64data.length,
            start, end,
            range: end-start
        })

        console.log(`Uploading chunk ${i} (${end-start} bytes)...`);
        const chunkUrl = ServiceEndpoint('/xferchunk')
        await postJson(chunkUrl, {
            id,
            chunkIndex: i,
            data: b64data
        });
    }

    // Step 3: XferFinish
    console.log('Calling XferFinish...');
    const finishUrl = ServiceEndpoint(`/xferfinish/${id}/${encodeURIComponent(mimeType)}`);
    const finishResp = await fetch(finishUrl);
    if (!finishResp.ok) {
        throw new Error(`HTTP Error ${finishResp.status}: ${await finishResp.text()}`);
    }
    const finishData:any = await finishResp.json();
    console.log('Upload complete! Final URL:', finishData.url);
    return finishData.url
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