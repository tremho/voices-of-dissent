
export const mimeMatch = {
    avif: 'image/avif',
    apng: 'image/apng',
    bmp: 'image/bmp',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    jfif: 'image/jpeg',
    pjpeg: 'image/jpeg',
    pjp: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    tif: 'image/tiff',
    tiff: 'image/tiff',
    webp: 'image/webp',

    aac: "audio/aac",
    mid: "audio/midi",
    midi: "audio/midi",
    mp3: "audio/mpeg",
    m4a: "audio/mp4",
    oga: "audio/ogg",
    opus: "audio/ogg",
    wav: "audio/wav",
    weba: "audio/webm"

}
export function getMimeType(filename:string) {
    let i = filename?.lastIndexOf('.') ?? -1
    if(i !== -1) {
        let ext = filename.substring(++i)
        return mimeMatch[ext]
    }
}