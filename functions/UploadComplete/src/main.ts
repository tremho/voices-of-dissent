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
import {S3Client, ListPartsCommand, CompleteMultipartUploadCommand} from '@aws-sdk/client-s3'


const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        Log.Info("Entering UploadComplete");
        const {uploadId, fileKey} =  event.parameters

        Log.Info("parameters", {uploadId, fileKey})
        let fk = fileKey.replace(':', '/').replace(':', '/')
        let fkt = fk.substring(fk.lastIndexOf('/')+1)
        const buckets = {
            art: "tremho-vod-art",
            audio: "tremho-vod-audio"
        }
        let bucketName = buckets[fkt]

        Log.Info("bucket deconstruction", {fk, fkt, bucketName})

        const s3 = new S3Client()
        const lpCommand:any = new ListPartsCommand({
            Bucket: bucketName,
            Key: fk,
            UploadId: uploadId
        })
        const resp1:any = await s3.send(lpCommand)
        Log.Info("response from lpCommand", resp1)
        const {Parts} = resp1
        Log.Info("Parts", Parts)
        Log.info("doing actual CompleteMultipartUploadCommand. Literally the last step...")
        const cmuCommand:any = new CompleteMultipartUploadCommand({
            Bucket: bucketName,
            Key: fk,
            UploadId: uploadId,
            MultipartUpload: {Parts: Parts.map(({ ETag, PartNumber}) => ({ETag, PartNumber}))}
        })
        const resp:any = await s3.send(cmuCommand)
        return Success({url:resp.Location, uploadId})
    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}
