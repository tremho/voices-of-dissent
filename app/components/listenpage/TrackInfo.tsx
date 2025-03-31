import React, {useState} from 'react'
import { IconButton, Button, Snackbar } from "@mui/material";
import { ThumbUp, ThumbUpOffAlt } from "@mui/icons-material";

const tiLayout:any = {
    display:"flex",
    justifyContent:"center",
    alignItems: "center"
}

const tiContainer:any = {
    width:"64%",
    minHeight: "100px",
    // border: "2px dashed darkred",
    backgroundColor: 'white'
}

const title:any = {
    color: "darkgreen",
    fontSize: "35px",
    fontWeight: "bold",
    marginBottom:"5px"
}
const artist:any = {

    color: "gray",
    fontSize: "17px",
    fontStyle: "italic",
    marginBottom: "15px"
}
const description:any = {
    minHeight: "100px",
    maxHeight: "100px",
    overflowY: "scroll",
    fontSize: "20px",
    color: 'darkblue'
}
const attributions:any = {
    minHeight: "50px",
    maxHeight: "50px",
    overflowY: "scroll",
    fontSize: "17px",
    color: "darkgreen"
}

function InfoLabel(props) {
    const {text} = props
    return ( <>
        <p style={{fontSize:"12px", color:"darkgray", fontStyle:"caps"}}>{text}</p>
        </>)
}

const titleAndLike:any = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width:"100%"
}
const shareAndEdit:any = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    // alignItems: "center",
    width:"100%"
}
const likeStyle:any = {
    color: "gray"
}
const descAndLinks:any = {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width:"100%"
}
const shareButtonSx:any ={
    backgroundColor: "white",
    color: "gray",
    border: "1px solid gray",
    fontSize: "0.75rem", // Smaller font
    padding: "2px", // Smaller padding
    marginTop: "2px",
    marginLeft: "5px",
    minWidth: "auto", // Prevents excessive width
    "&:hover": {
        backgroundColor: "#f0f0f0"
    }
}

function handleEdit(contentId) {
    console.log("Handle Edit", {contentId})
    if(contentId) {
        const parts = contentId.split('/')
        location.href = '/?page=upload&id='+parts[0]+'&edit='+parts[1]
    }

}


export function TrackInfo(props) {
    const [openSnack, setOpenSnack] = useState(false);
    const [snackMessage, setSnackMessage] = useState('')
    // console.log("selectedData passed into TrackInfo", props.selectedData)
    function LikeButton() {

        // console.log("selectedData passed into LikeButton", props.selectedData)

        const [numLikes, setNumLikes] = React.useState(0)
        const [liked, setLiked] = React.useState(false)

        async function updateLike(likeType = '') {
            // fetch like info
            // console.log("updateLike", {likeType, props})
            let parts = props?.selectedData?.id?.split('/') ?? []
            let artistId = parts[0] ?? ''
            let contentId = parts[1] ?? ''

            // console.log("parts", {artistId, contentId})

            // note that 'id' is both artistId and contentId combined already...
            let likerId = props?.identity ?? ''
            if(!likerId || !contentId || contentId === 'undefined') contentId = ''
            if(!likerId || !contentId) likeType = ''

            // console.log("like properties", {likerId, artistId, contentId, likeType})
            const likeUrl = `/like/${likerId}/${artistId}/${contentId}/${likeType}`
            // console.log("Fetching like", {props, likeUrl})
            const resp = await fetch(likeUrl, {
                method:"PUT",
                headers: { "Content-Type": "application/json" }
            })
            const likeInfo = await resp.json()
            setNumLikes(likeInfo.numLikes)
            setLiked(likeInfo.like)
        }
        React.useEffect(() => {
            updateLike().then(() =>{})
        }, [liked])

        function clickedLike() {
            let type = liked ? 'dislike' : 'like'
            updateLike(type)
        }
        return (
            <>
                <IconButton onClick={clickedLike} color={liked? "primary" : "default"}>
                    {liked ? <ThumbUp /> : <ThumbUpOffAlt />}
                </IconButton>
                <span style={likeStyle}>{numLikes} likes</span>
            </>
        )
    }

    function copyShareUrl(type, data) {
        if(!data) return ''
        const url = type === 'song' ? location.protocol+'//'+location.host+'/?page=listen&ref='+(data?.id ?? '')
            : data?.audioUrl ?? ''
        navigator.clipboard.writeText(url)
        // console.log("to clipboard ", url)
        setSnackMessage(type === 'song' ? 'Song page link copied to clipboard for sharing'
            : 'Audio url link copied to clipboard for sharing'
        )
        setOpenSnack(true)
    }
    function handleSnackClose(_, reason) {
        if( reason === 'clickaway') return
        setOpenSnack(false)
    }


    return (
        <>
            <div style={tiLayout}>
                <div style={tiContainer} >
                    <div style={titleAndLike}>
                        <div>
                            <InfoLabel text="title"/>
                            <div style={title}>
                                {props?.selectedData?.title ?? ''}
                            </div>
                        </div>
                        <div style={likeStyle}>
                            <LikeButton />
                        </div>
                    </div>
                    <div>
                        <InfoLabel text="artist"/>
                        <div style={artist}>
                            {props?.selectedData?.artistName ?? ''}
                        </div>
                    </div>
                    <div>
                        <InfoLabel text="description"/>
                        <div style={description}>
                            {props?.selectedData?.description ?? ''}
                        </div>
                    </div>
                    <div>
                        <InfoLabel text="attributions" />
                        <div style={attributions}>
                            {props?.selectedData?.attributions ?? ''}
                        </div>
                    </div>
                    <div style={{...shareAndEdit, display: props?.selectedData ? shareAndEdit.display : "none"}}>
                        <InfoLabel text="Copy Sharable Links"/>
                        <Snackbar
                            open={openSnack}
                            autoHideDuration={3000}
                            onClose={handleSnackClose}
                            message={snackMessage}
                            anchorOrigin={ {vertical:"bottom", horizontal:"center"} as any}
                        />
                        <div>
                            <Button variant="contained"
                                    onClick={() => copyShareUrl("song", props?.selectedData) as any}
                                    sx={shareButtonSx}
                            >
                                Song Page
                            </Button>
                            <Button variant="contained"
                                    onClick={() => copyShareUrl("audio", props?.selectedData) as any}
                                    sx={shareButtonSx}
                            >
                                Audio link only
                            </Button>
                        </div>
                        <EditIfOurs identity={props?.identity} contentId={props?.selectedData?.id}/>
                    </div>
                </div>
            </div>
        </>
    )
}

function EditIfOurs(props) {
    if(props) {
        const trackId = (props.contentId??'').split('/')[0].trim()
        if(trackId && props.identity !== trackId) {
            return
        }
    }
    return (
        <>
        <div>
            <Button variant="contained"
                    onClick={() =>{handleEdit(props?.contentId)}}
                    sx={{...shareButtonSx, color:"blue"}}
            >
                Edit
            </Button>
        </div>
        </>
    )

}