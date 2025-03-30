import {
    LambdaApi,
    getAssetUrl,
    Success,
    NotFound,
    NotImplemented,
    ServerError, BadRequest,
} from "@tremho/inverse-y"
import fs from "fs"
import path from 'path'
import {Log} from "@tremho/inverse-y"
import {s3GetObject, s3PutObject} from "@tremho/basic-s3-actions";

const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        Log.Info("Entering Skips");
        const {identity} = event.parameters
        let skippedIds = event.body.skippedIds
        Log.Info("body in", event.body)
        if(skippedIds === 'undefined') skippedIds = null
        Log.Info("type of skippedIds ", typeof skippedIds)
        if(skippedIds && !Array.isArray(skippedIds)) return BadRequest('skippedIds is not an array')
        if(!identity || identity === 'undefined') {
            return Success({skipped: []})
        }
        Log.Info("inputs", {identity, skippedIds})
        const info:any = await s3GetObject('tremho-vod-info', identity)
        if(skippedIds) {
            info.skippedIds = skippedIds
            Log.Info("updated info", {info})
            await s3PutObject('tremho-vod-info', identity, info, true)
        }
        const out = {skipped: info.skippedIds ?? []}
        Log.Info("out", {out})
        return Success(out)
    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}
