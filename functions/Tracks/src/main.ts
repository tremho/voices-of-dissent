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
        Log.Info("Entering Tracks");
        const {artist, id} = event.parameters
        console.log("parameters passed", {artist, id})
        if(artist && id) {
            resp = await getTopLevelInfo(artist, id)
        } else {
            resp = await getAllTracks()
        }
        // console.log("returning", {resp})
        return Success(resp)
    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}

const dataBucket = 'tremho-vod-data'
const infoBucket = 'tremho-vod-info'

async function getAllTracks() :Promise<TrackData[]> {
    let outTracks:any[] = []
    let tracks: string[] = []
    try {
        tracks = await s3ListObjects(dataBucket)
    } catch(e:any) {

    }
    const out:TrackData[] = []
    for(let item of tracks) {
        const [artist, id] = item.split('/')
        const tl = await getTopLevelInfo(artist, id)
        out.push(tl)
    }
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
