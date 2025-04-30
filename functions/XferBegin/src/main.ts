import {
    LambdaApi,
    Success,
} from "@tremho/inverse-y"
import fs from "fs"
import path from 'path'
import {Log} from "@tremho/inverse-y"
import sha1 from 'sha1'
import {s3CreateBucket, s3PutObject} from '@tremho/basic-s3-actions'
import {getMimeType} from "./lib/MimeType";

const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        Log.Info("Entering XferBegin");

        Log.Info("body type in ", typeof event.body)
        if(typeof event.bodyType === 'string') event.body = JSON.parse(event.body)
        const {fileName, contentId} = event.body
        Log.Info("body ", event.body)
        Log.Info("body values ", {fileName, contentId})
        const now = Date.now()
        const mimeType = getMimeType(fileName)
        const id = sha1(fileName+now).toString()
        Log.Info("Name to id ", {fileName, id, mimeType, contentId})
        Log.Info('creating bucket')
        await s3CreateBucket(id)
        Log.Info('putting meta object')
        await s3PutObject(id, '.meta', {fileName, mimeType, contentId})
        Log.Info('returning id ', id)
        return Success({id})
    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}
