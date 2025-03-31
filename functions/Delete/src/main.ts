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
import {s3Delete, s3DeleteBucket} from "@tremho/basic-s3-actions";

const dataBucket = 'tremho-vod-data'
const artBucket = 'tremho-vod-art'
const audioBucket = 'tremho-vod-audio'

const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        Log.Info("Entering Delete");
        Log.Info("parameters passed", event.parameters)
        const {artist, id} = event.parameters
        Log.Info('parameters retrieved', {artist, id})
        const contentId = artist + '/'+id
        Log.Info("deleting data object "+ contentId)
        await s3Delete(dataBucket, contentId)
        Log.Info("deleting art object "+ contentId)
        await s3Delete(artBucket, contentId+'/art')
        Log.Info("deleting audio object "+ contentId)
        await s3Delete(audioBucket, contentId+'/audio')

        return Success("Hello, World!")
    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}
