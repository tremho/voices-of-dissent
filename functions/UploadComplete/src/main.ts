import {
    LambdaApi,
    getAssetUrl,
    Success,
    NotFound,
    NotImplemented,
    ServerError,
    BadRequest
} from "@tremho/inverse-y"
import fs from "fs"
import path from 'path'
import {Log} from "@tremho/inverse-y"
import {CompleteMultipartUploadCommand, ListPartsCommand, S3Client} from "@aws-sdk/client-s3";

const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        Log.Info("Entering Complete");
        let {uploadId, fileKey} = event.parameters
        Log.Info("extracted from parameters", {uploadId, fileKey})
        let fk = fileKey
        while(fk.indexOf(":") !== -1) fk = fk.replace(':', '/')
        let ti = fk.lastIndexOf('/')
        let fkt = fk.substring(ti+1)
        // fk = fk.substring(0,ti)
        const buckets = {
            art: "tremho-vod-art",
            audio: "tremho-vod-audio"
        }
        let bucketName = buckets[fkt]

        Log.Info(">>>>>> bucket deconstruction", {fk, fkt, bucketName, uploadId})

        const s3 = new S3Client()
        const lpCommand:any = new ListPartsCommand({
            Bucket: bucketName,
            Key: fk,
            UploadId: uploadId
        })
        Log.Info("calling ListPartsCommand", {bucketName, fk, uploadId})
        const resp1:any = await s3.send(lpCommand)
        Log.Info("response from lpCommand", resp1)
        const {Parts} = resp1
        Log.Info("Parts", JSON.stringify(Parts))
        Log.info("doing actual CompleteMultipartUploadCommand. Literally the last step...")
        const cmuCommand:any = new CompleteMultipartUploadCommand({
            Bucket: bucketName,
            Key: fk,
            UploadId: uploadId,
            MultipartUpload: {Parts: Parts?.map(({ ETag, PartNumber}) => ({ETag, PartNumber}))}
        })
        let sresp:any
        let error:string = ''
        try {
            sresp = await s3.send(cmuCommand)
        } catch(e:any) {
            error = e.message
        }
        let resp:any = error ? BadRequest(error) : Success({url:sresp.Location, uploadId})
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
