import {
    LambdaApi,
    getAssetUrl,
    Success,
    NotFound,
    NotImplemented,
    ServerError,
} from "@tremho/inverse-y"
import fs from "fs"
import path from 'path'
import {Log} from "@tremho/inverse-y"
import {TrackData} from "./lib/TrackData";
import {
    s3ListObjects,
    s3GetObject
} from "@tremho/basic-s3-actions";

const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        let resp
        Log.Info("Entering Tracks", {event});
        // let index = 1; // skip name
        // if(event.request.originalUrl.indexOf("tremho.com") !== -1) {
        //     index++ // skip prefix before name
        // }
        // let pathParts = event.pathParts
        // if(pathParts.length === 0) {
        //     pathParts = event.request.originalUrl.split('/')
        //     index = pathParts.indexOf('tracks')+1
        // }
        // let [artist, id] = pathParts.slice(index)
        // if(!artist || artist === 'undefined') artist = ''

        let {artist, id} = event.parameters

        if(!id || id === 'undefined') id = ''
        console.log("parameters passed", {artist, id})
        if(artist?.length && id?.length) {
            resp = await getTopLevelInfo(artist, id)
        } else {
            resp = await getAllTracks()
        }
        console.log("returning", {resp})
        const respx:any = Success(resp)
        if(!respx.headers) respx.headers = {}
        // Add CORS Headers explicitly
        respx.headers = Object.assign(respx.headers, {
            "Access-Control-Allow-Headers" : "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,GET"
        })
        return respx

    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}

const dataBucket = 'tremho-vod-data'
const infoBucket = 'tremho-vod-info'

let tlName = ''
async function getAllTracks() :Promise<TrackData[]> {
    console.log("getAllTracks")
    let outTracks:any[] = []
    let tracks: string[] = []
    try {
        tracks = await s3ListObjects(dataBucket)
    } catch(e:any) {

    }
    tracks = shuffleArray(tracks)
    const out:TrackData[] = []
    for(let item of tracks) {
        const [artist, id] = item.split('/')
        console.log("getting tl info for "+ artist +'/' + id)
        const tl = await getTopLevelInfo(artist, id)
        if(tl.artistName) tlName = tl.artistName
        if(tl.artistId) out.push(tl)
    }
    return out
}
async function getTopLevelInfo(artist:string, id:string) : Promise<TrackData> {

    Log.Info("toplevel name ", tlName)
    if(artist === 'undefined') artist = ''
    if(id === 'undefined') id = ''
    if(!tlName) {
        Log.Info("getting tlName")
        const info = artist ? await s3GetObject(infoBucket, artist) : {}
        tlName = info?.artistName ?? ''
    }
    if(!artist) return {} as TrackData
    const trackInfo:TrackData = await s3GetObject(dataBucket, artist+'/'+id)
    Log.Info('trackInfo in', {trackInfo})
    trackInfo.id = artist+'/'+id
    if(trackInfo.artistName === 'undefined') trackInfo.artistName = tlName
    trackInfo.artFileName = (trackInfo as any).artFile?.path?.substring(1) ?? ''
    trackInfo.audioFileName = (trackInfo as any).audioFile?.path?.substring(1) ?? ''
    delete (trackInfo as any).artFile
    delete (trackInfo as any).audioFile
    Log.Info('trackInfo out', {trackInfo})
    return trackInfo
}
function shuffleArray(array) {
    const shuffled = [...array]; // Make a copy to avoid mutating the original
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1)); // Pick a random index
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
    }
    return shuffled;
}