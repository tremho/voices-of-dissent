import {
    LambdaApi,
    Success,
    ServerError,
} from "@tremho/inverse-y"
import fs from "fs"
import path from 'path'
import {Log} from "@tremho/inverse-y"
import {s3Delete, s3DeleteBucket, s3GetObject, s3GetText, s3ListObjects} from "@tremho/basic-s3-actions";
import {CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, ListPartsCommand, S3Client} from "@aws-sdk/client-s3";



const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const s3 = new S3Client()

const service = new LambdaApi<any>(def,
    async (event:any) => {
        Log.Info("Entering XferFinish");

        const {id, type} = event.parameters
        Log.Info("Parameters: ", {id, type})

        Log.Info("reading metadata")
        const meta = await s3GetObject(id, '.meta')
        Log.Info("metadata found ", {meta})
        const {contentId, mimeType} = meta

        Log.Info('creating collection buffer')
        const FullChunkSize = 5 * 1024 * 1024
        let workingBuffer = Buffer.alloc(0);
        let chunkIndex = 0;
        let errorMessage = '';
        let offset = 0

        Log.Info("Starting multipart upload")
        const uploadId = await initiateS3Upload(meta.contentId, meta.mimeType)

        const objects = await s3ListObjects(id)
        Log.Info(`Starting to process ${objects.length} objects to S3...`)


        let remainingBytes = 0
        for(let key of objects) {

            if (key === '.meta') {
                continue;  // <---- SKIP the metadata object
            }

            try {
                Log.Info("reading data from object "+key)
                const b64Data = await s3GetText(id, key)
                if(!b64Data) {
                    Log.Error("No data returned for "+key)
                    continue
                }
                Log.Info('b64Data length is '+b64Data.length)
                const buffer = Buffer.from(b64Data, 'base64')

                Log.Info("concatenating buffer")

                // Concatenate current working buffer + new chunk
                workingBuffer = Buffer.concat([workingBuffer, buffer]);

                Log.Info("Flush full parts")
                // Flush full parts
                while (workingBuffer.length >= FullChunkSize && !errorMessage) {
                    Log.Info("..extract part")
                    const partToUpload = workingBuffer.subarray(0, FullChunkSize);
                    errorMessage = await uploadS3Part(uploadId, contentId, chunkIndex, mimeType, partToUpload);
                    chunkIndex++;

                    Log.Info("..Shift working buffer")

                    // Slice off what was uploaded
                    workingBuffer = workingBuffer.subarray(FullChunkSize);
                }
            }
            catch(e:any) {
                Log.Exception(e)
                errorMessage = "Aborted due to exception: "+e.message
            }
        }
        if (workingBuffer.length > 0 && !errorMessage) {
            Log.Info(`Writing last chunk ${chunkIndex} with ${workingBuffer.length} bytes`);
            errorMessage = await uploadS3Part(uploadId, contentId, chunkIndex, mimeType, workingBuffer);
        }
        if(errorMessage) {
            return ServerError(errorMessage)
        }
        Log.Info("Doing multipart complete")
        const resp:any = await completeS3Upload(uploadId, contentId, mimeType)
        const {url, error} = resp
        if(error) {
            Log.Error("Error in completion: "+error)
        }
        Log.Info("url for upload is "+url)

        Log.Info("deleting objects")
        for(let obj of objects) {
            await s3Delete(id, obj)
        }
        Log.Info("deleting bucket")
        await s3DeleteBucket(id)

        if(error) {
            return ServerError(error)
        }
        return Success({url})
    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}

async function initiateS3Upload(contentId:string, mimeType:string) {

    const {bucketName, suffix} = resolveBucketAndSuffix(mimeType)

    const command:any = new CreateMultipartUploadCommand({Bucket: bucketName, Key: contentId+suffix, ContentType: mimeType})
    const resp:any = await s3.send(command)
    return resp.UploadId
}

async function uploadS3Part(uploadId:string, contentId:string, chunkIndex:number, mimeType:string, chunkBuffer:any) {

    const {bucketName, suffix} = resolveBucketAndSuffix(mimeType)

    const command:any = new UploadPartCommand({
        Bucket: bucketName,
        Key: contentId+suffix,
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
    Log.Info('UploadPart response: ', cresp)

    return error
}

async function completeS3Upload(uploadId:string, contentId:string, mimeType:string) {

    const {bucketName, suffix} = resolveBucketAndSuffix(mimeType)

    const lpCommand:any = new ListPartsCommand({
        Bucket: bucketName,
        Key: contentId+suffix,
        UploadId: uploadId
    })
    Log.Info("calling ListPartsCommand", {bucketName, contentId, uploadId})
    const resp1:any = await s3.send(lpCommand)
    Log.Info("response from lpCommand", resp1)
    const {Parts} = resp1

    const cmuCommand:any = new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: contentId+suffix,
        UploadId: uploadId,
        MultipartUpload: {Parts: Parts?.map(({ ETag, PartNumber}) => ({ETag, PartNumber}))}
    })
    let sresp:any
    let error:string = ''
    try {
        sresp = await s3.send(cmuCommand)
        return {url:sresp.Location}
    } catch(e:any) {
        error = e.message
        return {error}
    }

}
function resolveBucketAndSuffix(mimeType: string): {bucketName: string, suffix: string} {
    if (mimeType.startsWith('audio/')) return { bucketName: 'tremho-vod-audio', suffix: '/audio' }
    if (mimeType.startsWith('image/')) return { bucketName: 'tremho-vod-art', suffix: '/art' }
    throw new Error(`Unsupported mimeType: ${mimeType}`)
}

