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

import {s3GetObject, s3PutObject} from "@tremho/basic-s3-actions";

const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        Log.Info("Entering UploadFinal");
        const {metaId, artistName, audioUrl, artUrl} = event.body
        Log.Info('parameters', {metaId, artistName, audioUrl, artUrl})
        Log.Info("typeof metaId ", typeof metaId)
        // read meta object
        Log.Info("reading meta object for "+metaId)
        const meta:any = await s3GetObject('tremho-vod-data', metaId)
        // append urls
        meta.artistName = artistName
        meta.artUrl = artUrl
        meta.audioUrl = audioUrl
        // write meta object
        console.log("data written to data bucket for "+metaId, {meta})
        await s3PutObject('tremho-vod-data', metaId, meta)
        return Success({metaId, artistName, audioUrl, artUrl})
    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}
