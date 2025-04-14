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

const dataBucket = 'tremho-vod-data'
const infoBucket = 'tremho-vod-info'


const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        Log.Info("Entering Covers");
        let arr = await getCovers(3)
        const out = JSON.stringify(arr)
        Log.Info("returning ", out)
        return Success(out)
    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}

async function getCovers(num) :Promise<string[]> {
    Log.Info('getCovers '+num)
    const out:string[] = []
    let tracks: string[] = []
    try {
        tracks = await s3ListObjects(dataBucket)
    } catch(e:any) {
        Log.Exception(e)
    }
    Log.Info("getting picks")
    const picks:number[] = []
    let t = Math.min(3, tracks.length)
    let i = 0;
    while(i < t) {
        const pick = Math.floor(Math.random() * tracks.length)
        if(!picks.includes(pick)) {
            picks.push(pick)
            i++
        }
    }
    if(tracks.length < 4) {
        for(let i=0; i<3; i++) {
            out.push( await getArtUrl(tracks[i]) )
        }
        picks.splice(0,picks.length)
    }
    Log.Info(`${tracks.length} tracks `, {picks} )

    async function getArtUrl(item) {
        if(!item) return ''
        const [artist, id] = item.split('/')
        Log.Info("getArtUrl ", {item, artist, id})
        if(!artist || artist === 'undefined' || !id || id === 'undefined') return ''
        const tl = await getTopLevelInfo(artist, id)
        Log.Info("topLevel info", {tl})
        return tl.artUrl
    }
    for(let p of picks) {
        Log.Info("processing pick ", p)
        let url = ''
        let maxtoploops = 3
        while(!url && --maxtoploops) {
            let item = tracks[p]
            url = await getArtUrl(item)
            Log.Info("picked", {item, url})
            if (url) out.push(url)
            else {
                Log.Info("Dupe handling starting at "+p)
                let maxloops = 3
                while(picks.includes(p) && --maxloops) {
                    if (++p >= tracks.length) p = 0
                }
                picks.push(p)
                Log.Info("out of dupe while loop at "+p)
            }
        }
    }
    Log.Info("returning cover results ", out)
    const resp:any = Success(JSON.stringify(out), 'text/plain')
    if(!resp.headers) resp.headers = {}
    // Add CORS Headers explicitly
    resp.headers = Object.assign(resp.headers, {
        "Access-Control-Allow-Headers" : "*",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,GET"
    })
    return resp
}
async function getTopLevelInfo(artist:string, id:string) : Promise<TrackData> {

    let info:any = {}
    try {
        info = await s3GetObject(infoBucket, artist)
    } catch(e:any) {}

    const trackInfo:TrackData = await s3GetObject(dataBucket, artist+'/'+id)
    trackInfo.id = artist+'/'+id
    trackInfo.artistName = info.artistName
    trackInfo.artFileName = (trackInfo as any).artFile?.path?.substring(1) ?? ''
    trackInfo.audioFileName = (trackInfo as any).audioFile?.path?.substring(1) ?? ''
    delete (trackInfo as any).artFile
    delete (trackInfo as any).audioFile
    return trackInfo
}
