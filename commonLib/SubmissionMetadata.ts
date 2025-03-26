/**
 * Structure of data submitted for content upload
 * Properties:
 *  - artistId:string     -- the identity.userIdentity of the logged in user
 *  - artistName:string   -- the artist name submitted (defaults to the last reported / derived from login value)
 *  - title:string        -- the title submitted
 *  - description:string  -- description of content submitted
 *  - attributions:string  -- attributions for content submitted
 *  - artFile?:File       -- the cover art file
 *  - audioFile?:File     -- the audio file
 */
export class SubmissionMetadata {
    artistId = ''
    artistName = ''
    title = ''
    description = ''
    attributions = ''
    artFile?:File
    audioFile?:File
}
