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
import {
    S3Client,
    UploadPartCommand
} from '@aws-sdk/client-s3'
// TODO: checking the toxic import theory

const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        Log.Info("Entering UploadChunk... ");
        // let body:any = event?.body ?? '{}'
        // if(typeof body === 'string') body = JSON.parse(body)
        const {uploadId, fileKey, chunkIndex} = event.parameters
        Log.Info("values from parameters ", {uploadId, fileKey, chunkIndex})
        const chunkBuffer = event.body
        Log.Info(`buffer contains ${chunkBuffer.byteLength} bytes`)

        let fk = fileKey.replace(':', '/').replace(':', '/')
        let fkt = fk.substring(fk.lastIndexOf('/')+1)
        const buckets = {
            art: "tremho-vod-art",
            audio: "tremho-vod-audio"
        }
        let bucketName = buckets[fkt]

        Log.Info("bucket and key decoding", {fk, fkt, bucketName})

        const s3 = new S3Client()
        const command:any = new UploadPartCommand({
            Bucket: bucketName,
            Key: fk,
            PartNumber: chunkIndex+1,
            UploadId: uploadId,
            Body: chunkBuffer
        })
        let cresp:any
        let error:string = ''
        try {
            cresp = await s3.send(command)
        } catch(e:any) {
            error = e.message
        }
        let resp:any
        if(error) {
            resp = BadRequest(error)
        } else {
            Log.Info("chunk response", cresp)
            const etag = cresp.ETag
            resp = Success({etag, chunkIndex})
        }
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
