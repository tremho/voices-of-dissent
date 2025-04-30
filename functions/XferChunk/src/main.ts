import {
    LambdaApi,
    Success
} from "@tremho/inverse-y"
import fs from "fs"
import path from 'path'
import {Log} from "@tremho/inverse-y"
import {s3PutText} from "@tremho/basic-s3-actions";

const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        Log.Info("Entering XferChunk");

        Log.Info("body type in ", typeof event.body)
        if(typeof event.body === 'string') event.body = JSON.parse(event.body)
        const {id, chunkIndex, data} = event.body
        Log.Info("Received: ", {id, chunkIndex, length:data.length})

        const key = chunkIndex < 10 ? 'chunk-000'+chunkIndex
                   : chunkIndex < 100 ? 'chunk-00'+chunkIndex
                   : chunkIndex < 1000 ? 'chunk-0'+chunkIndex
                   : 'chunk-'+chunkIndex

        await s3PutText(id, key, data, true)

        Log.Info(`Put chunk ${chunkIndex} as ${key}, ${data.length} characters`)

        return Success({})
    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}
