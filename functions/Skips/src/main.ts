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
        Log.Info("Entering Skips", {event});
        const {identity} = event.parameters
        Log.Info("body ("+typeof event.body+") in ", event.body)
        let skippedIds = event.body?.skippedIds
        Log.Info("type of skippedIds ", typeof skippedIds)
        Log.Info("input values here: ", {identity, skippedIds})
        if(skippedIds && !Array.isArray(skippedIds)) {
            Log.Error("BadRequest - skippedIds is not an array")
            return BadRequest('skippedIds is not an array')
        }
        if(!identity || identity === 'undefined') {
            Log.Error("not a logged in user; has no skips")
            return Success({skipped: []})
        }
        Log.Info("validated inputs", {identity, skippedIds})
        Log.Info("getting info for identity "+identity)
        const info:any = await s3GetObject('tremho-vod-info', identity)
        if(info && skippedIds) {
            info.skippedIds = skippedIds
            Log.Info("updated info", {info})
            await s3PutObject('tremho-vod-info', identity, info, true)
        }
        const out = {skipped: info?.skippedIds ?? []}
        Log.Info("out", {out})
        const resp:any = Success(out)
        if(!resp.headers) resp.headers = {}
        // Add CORS Headers explicitly
        resp.headers = Object.assign(resp.headers, {
            "Access-Control-Allow-Headers" : "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,GET"
        })
        return resp

    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}
