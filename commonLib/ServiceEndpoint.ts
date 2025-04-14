export default function ServiceEndpoint(inPath:string) : string {
    if(location.host.includes('amazonaws.com')) {
        if(!inPath || inPath === '/') return '/Dev/+'
        if(inPath.indexOf('?') !== -1) {
            return '/Dev/+'+inPath.substring(1)
        }
        return '/Dev'+inPath
    }
    if(location.host.includes('services.tremho.com')) {
        if(inPath.indexOf('?') !== -1) {
            return '/vod/+'+inPath.substring(1)
        }
        if(inPath?.charAt(1) === '?') inPath = '/+'+inPath.substring(1)
        if(!inPath || inPath === '/') {
            console.log("go home service def returning /+")
            inPath = '/+'
        }
        return '/vod'+inPath
    }
    return inPath
}

// TODO: Need to find a better, global way to do this. Maybe inverse-y can fetch JSON from self instead of using 'fs'
export function getAssetUrl(idPath) {
    // console.log('getAssetUrl', {host: location.host, idPath})
    if(location.host.indexOf('localhost') !== -1) {
        return idPath
    }
    return "https://tremho-aprilfools.s3.us-west-1.amazonaws.com/"+idPath
}
