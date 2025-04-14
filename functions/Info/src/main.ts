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

// Yes, this is a GET operation that we are recording info with... but it should be okay because it's still idempotent.

const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        Log.Info("Entering Info");
        let {id, name, email} = event.parameters
        console.log("parameters ", {id, name, email})
        const bucket = 'tremho-vod-info'
        // get or create an info object for this id (tremho-vod-info)
        let info:any = {}
        try {
            info = await s3GetObject(bucket, id)
            if(info.name === 'undefined') info.name = ''
            if(info.artistName === 'undefined') info.artistName = ''
            if(info.email === 'undefined') info.email = ''
        } catch(e:any) {

        }
        if(name) name = decodeURIComponent(name)

        Log.Info("inputs", {id, name, email, info})
        // if we have no email or no previous artist name, set the artist name to the given name
        let checkWrite = false
        if(name?.length) {
            console.log("setting name to "+name)
            info.name = name
            checkWrite = true
        }
        if(!email?.length || !info.artistName?.length) {
            if(name) {
                console.log("setting artist name to "+name)
                info.artistName = name
                checkWrite = true
            }
        }
        // record the email if we haven't already
        if(!info.email?.length) {
            console.log("setting email to "+email)
            info.email = email
            checkWrite = true
        }
        Log.Info("info prior to undefined check ", info)
        if(info.name === 'undefined') info.name = ''
        if(info.artistName === 'undefined') info.artistName = ''
        if(info.email === 'undefined') info.email = ''
        Log.Info("Check for write " + checkWrite)
        if(checkWrite) {
            try {
                await s3PutObject(bucket, id, info, true)
                Log.Info('info written', info)
            } catch (e: any) {

            }
        }
        Log.Info('info returned', info)
        const resp:any = Success(JSON.stringify(info),"text/plain")
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
