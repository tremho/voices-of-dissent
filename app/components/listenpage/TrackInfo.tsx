import React from 'react'
import { IconButton } from "@mui/material";
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
const likeStyle:any = {
    color: "gray"
}

export function TrackInfo(props) {
    console.log("selectedData passed into TrackInfo", props.selectedData)
    function LikeButton() {

        console.log("selectedData passed into LikeButton", props.selectedData)

        const [numLikes, setNumLikes] = React.useState(0)
        const [liked, setLiked] = React.useState(false)

        async function updateLike(likeType = '') {
            // fetch like info
            console.log("updateLike", {likeType, props})
            let parts = props?.selectedData?.id.split('/') ?? []
            let artistId = parts[0] ?? ''
            let contentId = parts[1] ?? ''

            console.log("parts", {artistId, contentId})

            // note that 'id' is both artistId and contentId combined already...
            let likerId = props?.identity ?? ''
            if(!likerId || !contentId || contentId === 'undefined') contentId = ''
            if(!likerId || !contentId) likeType = ''

            console.log("like properties", {likerId, artistId, contentId, likeType})
            const likeUrl = `/like/${likerId}/${artistId}/${contentId}/${likeType}`
            console.log("Fetching like", {props, likeUrl})
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
                </div>
            </div>
        </>
    )
}