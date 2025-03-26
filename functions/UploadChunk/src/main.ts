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
import {S3Client, UploadPartCommand} from '@aws-sdk/client-s3'

const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        Log.Info("Entering UploadChunk");
        const {uploadId, fileKey, chunkIndex} = event.parameters
        Log.Info("parameters passed ", {uploadId, fileKey, chunkIndex})
        // Log.Info("body object", event.body)
        const base64 = event.body.base64
        Log.Info(`base64 received as ${base64.length} bytes`)
        const chunkBuffer = Buffer.from(base64, "base64")

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
        const resp:any = await s3.send(command)
        Log.Info("chunk response", resp)
        const etag = resp.ETag
        return Success({etag, chunkIndex})
    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}
