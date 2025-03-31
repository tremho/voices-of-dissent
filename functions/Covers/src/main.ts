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
    let outTracks:any[] = []
    let tracks: string[] = []
    try {
        tracks = await s3ListObjects(dataBucket)
    } catch(e:any) {

    }
    const picks:number[] = []
    let i = 0;
    while(i < 3) {
        const pick = Math.floor(Math.random() * tracks.length)
        if(!picks.includes(pick)) {
            picks.push(pick)
            i++
        }
    }
    Log.Info(`${tracks.length} tracks `, {picks} )
    const out:string[] = []
    async function getArtUrl(item) {
        if(!item) return ''
        const [artist, id] = item.split('/')
        const tl = await getTopLevelInfo(artist, id)
        return tl.artUrl
    }
    for(let p of picks) {
        Log.Info("processing pick ", p)
        let url = ''
        while(!url) {
            let item = tracks[p]
            url = await getArtUrl(item)
            Log.Info("picked", {item, url})
            if (url) out.push(url)
            else { // if pick results in a null url, find the next one that isn't empty
                Log.Info("Dupe handling starting at "+p)
                while(picks.includes(p)) {
                    if (++p >= tracks.length) p = 0
                }
                picks.push(p)
                Log.Info("out of dupe while loop at "+p)
            }
        }
    }
    Log.Info("returning cover results ", out)
    return out
}
async function getTopLevelInfo(artist:string, id:string) : Promise<TrackData> {

    const info = await s3GetObject(infoBucket, artist)
    const trackInfo:TrackData = await s3GetObject(dataBucket, artist+'/'+id)
    trackInfo.id = artist+'/'+id
    trackInfo.artistName = info.artistName
    trackInfo.artFileName = (trackInfo as any).artFile?.path?.substring(1) ?? ''
    trackInfo.audioFileName = (trackInfo as any).audioFile?.path?.substring(1) ?? ''
    delete (trackInfo as any).artFile
    delete (trackInfo as any).audioFile
    return trackInfo
}
