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
        Log.Info("Entering Main");
        const {metaId, audioUrl, artUrl} = event.body
        // read meta object
        const meta:any = await s3GetObject('tremho-vod-data', metaId)
        // append urls
        meta.artUrl = artUrl
        meta.audioUrl = audioUrl
        // write meta object
        await s3PutObject('tremho-vod-data', metaId, meta)
        return Success({metaId, audioUrl, artUrl})
    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}
