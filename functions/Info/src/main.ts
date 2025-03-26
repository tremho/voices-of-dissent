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
        name = decodeURIComponent(name)
        const bucket = 'tremho-vod-info'
        // get or create an info object for this id (tremho-vod-info)
        let info:any = {}
        try {
            info = await s3GetObject(bucket, id)
        } catch(e:any) {

        }
        Log.Info("inputs", {id, name, email, info})
        // if we have no email or no previous artist name, set the artist name to the given name
        if(name) info.name = name
        if(!email || !info.artistName) {
            if(name) info.artistName = name
        }
        // record the email if we haven't already
        if(!info.email) {
            info.email = email
        }
        let checkWrite = (info.artistName ?? '').length
        Log.Info("Check for write", checkWrite)
        if(checkWrite) {
            try {
                await s3PutObject(bucket, id, info, true)
                Log.Info('info written', info)
            } catch (e: any) {

            }
        }
        Log.Info('info returned', info)
        return Success(info)
    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}
