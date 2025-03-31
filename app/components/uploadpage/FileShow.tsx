import React from 'react'


export function FileShow(props) {
    // console.log("Entering FileShow", {props})
    const imageFile:File = props.imageFile
    const audioFile:File = props.audioFile
    const [imageUrl, setImageUrl] = React.useState<string>(null)
    const [audioUrl, setAudioUrl] = React.useState<string>(null)

    if(imageFile) {
        // console.log('getting image url')
        const reader:any = new FileReader()
        reader.onload = () => {
            // console.log('got reader result', {reader, result:reader.result})
            setImageUrl(reader.result)
            // console.log('set image url', imageUrl)
        }
        reader.readAsDataURL(imageFile)
    } else if(props.editArtUrl && !imageUrl) {
        setImageUrl(props.editArtUrl)
    }
    if(audioFile) {
        // console.log('getting audio url')
        const reader:any = new FileReader()
        reader.onload = () => {
            // console.log('got reader result', {reader, result:reader.result})
            setAudioUrl(reader.result)
            // console.log('set audio url', audioUrl)
        }
        reader.readAsDataURL(audioFile)
    } else if(props.editAudioUrl && !audioUrl) {
        setAudioUrl(props.editAudioUrl)
    }

    const fileInfo:any = {
    }

    function fileSize(file:File) {

        if(!file) return ''

        let size = file.size;
        let sfx = "bytes"
        const KB = 1024
        const MB = KB*KB
        if(size > MB) {
            size /= MB
            sfx = 'MB'
        } else if(size > KB) {
            size /= KB
            sfx = 'KB'
        }
        return '('+ size.toLocaleString(undefined, {minimumFractionDigits: 2}) + ' '+sfx+')'

    }

    // console.log("showing FileShow", {audioUrl, imageUrl})
    return (
        <>
            <div style={fileInfo}>
                {(audioFile as any)?.name ?? 'choose an audio file'} {fileSize(audioFile as File)}<br/>
                {(imageFile as any)?.name ?? 'choose a cover art image file'} {fileSize(imageFile as File)} <br/>
            </div>
            <div>
                <img src={imageUrl} width="150" height="150"/>
            </div>
            <div>
                <audio controls style={{marginLeft: "-10px"}} src={audioUrl}/>
            </div>
        </>
    )

}