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
import {
    s3GetObject,
    s3PutObject
} from '@tremho/basic-s3-actions'

const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        Log.Info("Entering Like", {event});

        // let index = 1; // skip name
        // if(event.request.originalUrl.indexOf("tremho.com") !== -1) index++ // skip pfx
        // let [likerId, artistId, contentId, likeType] = event.pathParts.slice(index)
        //
        // Log.Info("raw parameters", {likerId, artistId, contentId, likeType})
        //
        // if(likerId === 'undefined') likerId = ''
        // if(artistId === 'undefined') artistId = ''
        // if(contentId === 'undefined') contentId = ''
        // if(likeType === 'undefined') likeType = ''

        const {likerId, artistId, contentId, likeType} = event.parameters

        Log.Info("parameters", {likerId, artistId, contentId, likeType})

        if(!artistId || !contentId) {
            Log.Info("early return")
            return Success({like:false, numLikes: 0})
        }
        Log.Info("continuing to process likeType "+likeType+" for "+artistId+'/'+contentId)

        const bucket = 'tremho-vod-data'
        const key = artistId+'/'+contentId

        const data:any = await s3GetObject(bucket, key)
        if(!data.likers) data.likers = []
        let likeNow = data.likers.indexOf(likerId) !== -1
        let touched = false
        if(likeType === 'like'  && !likeNow) {
            data.likers.push(likerId)
            touched = true
            likeNow = true
        }
        if(likeType === 'dislike' && likeNow) {
            const index = data.likers.findIndex(item => item === likerId);
            if (index !== -1) {
                data.likers.splice(index, 1);
                touched = true
                likeNow = false
            }
        }

        if(touched && likerId) {
            await s3PutObject(bucket, key, data, true)
        }
        // get data
        const out = {
            like: likeNow,
            numLikes: data.likers.length
        }
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
