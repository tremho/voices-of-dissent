import React, {useState, useEffect} from 'react'
import ServiceEndpoint  from "../../../commonLib/ServiceEndpoint";
const coverSize = 200

const coverCommon:any = {
    position: "relative",
    top:"15px",
    width: coverSize+"px",
    height: coverSize+"px",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    border: "1 solid black"
}

const container:any = {
    backgroundColor: "pink",
    height:"220px",
    paddingLeft: "15%"
}


export function SampleCovers(props:any) {
    const [coverstyles, setCoverstyles] = useState<any>(null)

    async function useEffectAsync() {
        if(!coverstyles) {
            const coverUrl = ServiceEndpoint('/covers')
            console.log("Fetching covers @ ", coverUrl)
            const resp = await fetch(coverUrl)
            let list = await resp.json()
            if(typeof list === 'string') list = JSON.parse(list)
            console.log("got back ", {list})
            if(typeof list === 'object' && list.body) {
                list = list.body
            }
            if(typeof list === 'string') list = JSON.parse(list)
            console.log("list realized ", list)
            if(list?.length) {
                console.log("processing cstyles")
                const cstyles = []
                for (let i = 0; i < 3; i++) {
                    let img = list[i]
                    console.log("image for "+i, img)
                    const cover = Object.assign({}, coverCommon)
                    cover.backgroundImage = `url(${img})`
                    const r = Math.floor(Math.random() * 60) - 30
                    cover.rotate = r + 'deg'
                    const d = Math.floor(Math.random() * 50) - 20
                    cover.top = (i * -coverSize) + d + 'px'
                    const off = Math.floor(Math.random() * coverSize / 5)
                    cover.left = (i * coverSize - off) + 'px'
                    cstyles.push(cover)
                }
                console.log("setting cstyles ", cstyles)
                setCoverstyles(cstyles)
            }
        }
    }
    useEffect(() => {
        useEffectAsync()
    }, [coverstyles])
    return (
        <>
            <div style={container}>
            <div style={coverstyles && coverstyles[0]}/>
            <div style={coverstyles && coverstyles[1]}/>
            <div style={coverstyles && coverstyles[2]}/>
            </div>
        </>
    )
}

