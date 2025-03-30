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
        Log.Info("Entering Like");
        let {likerId, artistId, contentId, likeType} = event.parameters

        Log.Info("raw parameters", {likerId, artistId, contentId, likeType})

        if(likerId === 'undefined') likerId = ''
        if(artistId === 'undefined') artistId = ''
        if(contentId === 'undefined') contentId = ''
        if(likeType === 'undefined') likeType = ''

        Log.Info("parameters", {likerId, artistId, contentId, likeType})

        if(!artistId || !contentId) return Success({like:false, numLikes: 0})

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
        return Success( out)
    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}
