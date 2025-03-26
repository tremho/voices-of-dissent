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
import {SubmissionMetadata} from './lib/SubmissionMetadata'
import {
    s3CreateBucket,
    s3ListObjects,
    s3PutObject
} from '@tremho/basic-s3-actions'

import {S3Client, CreateMultipartUploadCommand} from '@aws-sdk/client-s3'
import {getMimeType} from "./lib/MimeType";


const VOD_METADATA_BUCKET = 'tremho-vod-data' // holds all the entries
const VOD_ARTFILE_BUCKET = 'tremho-vod-art' // all the cover art objects
const VOD_AUDIO_BUCKET = 'tremho-vod-audio' // all the audio objects

const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        let artId:string = ''
        let audioId:string = ''

        const info:SubmissionMetadata = event.body

        Log.Info("Entering Initiate", {info});
        await insureBucketsAvailable()
        // create metadata S3 object and remember the identifier
        Log.Info("creating metadata")
        const metaId = await createMetadataObject(info)
        Log.Info("metaId", {metaId})
        Log.Info("now getting upload ids...", {artFile: info.artFile, audioFile: info.audioFile})
        // initiate the upload for the art and remember the identifier
        if(info.artFile) {
            const mimeType = getMimeType((info.audioFile as any)?.path)
            Log.Info( "initiate art", {artFile: info.artFile, mimeType})
            artId = await initiateArtUpload(metaId, mimeType)
        }
        // initiate the upload for the audio and remember the  identifier
        if(info.audioFile) {
            const mimeType = getMimeType((info.audioFile as any)?.path)
            Log.Info("initiate audio", {audioFile: info.audioFile, mimeType})
            audioId = await initiateAudioUpload(metaId, mimeType)
        }
        Log.Info("all Ids",  {metaId, artId, audioId})
        Log.Info("-----------------")
        // return the identifiers
        return Success( {metaId, artId, audioId} )
    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}

async function insureBucketsAvailable() {
    let foundMetadata = false
    let foundArt = false
    let foundAudio = false

    try {
        await s3ListObjects(VOD_METADATA_BUCKET)
        foundMetadata = true
        await s3ListObjects(VOD_ARTFILE_BUCKET)
        foundArt = true
        await s3ListObjects(VOD_AUDIO_BUCKET)
        foundAudio = true
    } catch(e:any) {
        if(!foundMetadata) {
            await s3CreateBucket(VOD_METADATA_BUCKET, false)
        }
        if(!foundArt) {
            await s3CreateBucket(VOD_ARTFILE_BUCKET, true)
        }
        if(!foundAudio) {
            await s3CreateBucket(VOD_AUDIO_BUCKET, true)
        }
    }
}

// create the top-level metadata object
async function createMetadataObject(info:SubmissionMetadata) {
    let metaId = info.artistId+'/'+Date.now()
    await s3PutObject(VOD_METADATA_BUCKET, metaId, info)
    return metaId
}

// initiate the upload for the art and remember the identifier
async function initiateArtUpload(metaId:string, mimeType) {

    Log.Info("initiateArtUpload", {metaId})
    const s3 = new S3Client()
    const command:any = new CreateMultipartUploadCommand({Bucket: VOD_ARTFILE_BUCKET, Key: metaId+'/art', ContentType:mimeType})
    const resp:any = await s3.send(command)
    Log.Info("initiateArtUpload response", {resp})
    return resp.UploadId
}

// initiate the upload for the audio and remember the identifier
async function initiateAudioUpload(metaId:string, mimeType) {

    const s3 = new S3Client()
    const command:any = new CreateMultipartUploadCommand({Bucket: VOD_AUDIO_BUCKET, Key: metaId+'/audio', ContentType:mimeType})
    const resp:any = await s3.send(command)
    return resp.UploadId
}