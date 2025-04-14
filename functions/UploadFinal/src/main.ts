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
        let body = event.body
        Log.Info("body in ", body)
        if(typeof body === 'string') body = JSON.parse(body)
        let {metaId, artistName, audioUrl, artUrl} = body
        Log.Info('extracted from body', {metaId, artistName, audioUrl, artUrl})
        Log.Info("typeof metaId ", typeof metaId)
        // read meta object
        Log.Info("reading meta object for "+metaId)
        const meta:any = await s3GetObject('tremho-vod-data', metaId)
        // append urls
        meta.artistName = artistName
        if(artUrl) meta.artUrl = artUrl
        if(audioUrl) meta.audioUrl = audioUrl
        // write meta object
        console.log("data written to data bucket for "+metaId, {meta})
        await s3PutObject('tremho-vod-data', metaId, meta)
        const resp:any = Success(JSON.stringify({metaId, artistName, audioUrl, artUrl}), 'application/json')
        if(!resp.headers) resp.headers = {}
        // Add CORS Headers explicitly
        resp.headers = Object.assign(resp.headers, {
            "Access-Control-Allow-Headers" : "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST"
        })
        return resp

    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}
