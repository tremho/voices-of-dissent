import React, {useState, useEffect} from 'react'

const coverSize = 200

const coverCommon:any = {
    position: "relative",
    top:"15px",
    width: coverSize+"px",
    height: coverSize+"px",
    backgroundSize: "contain",
    border: "1 solid black"
}

const container:any = {
    backgroundColor: "pink",
    height:"220px"
}


export function SampleCovers(props:any) {
    const [coverstyles, setCoverstyles] = useState<any>(null)

    async function useEffectAsync() {
        if(!coverstyles) {
            // console.log("Fetching covers...")
            const resp = await fetch('/covers')
            const list = await resp.json()
            // console.log("got back ", {list})
            const cstyles = []
            for (let i=0; i<3; i++) {
                let img = list[i]
                const cover = Object.assign({},coverCommon)
                cover.backgroundImage = `url(${img})`
                const r = Math.floor(Math.random() * 60) - 30
                cover.rotate = r+'deg'
                const d = Math.floor(Math.random() * 50) - 20
                cover.top = (i * -coverSize) + d + 'px'
                const off = Math.floor(Math.random() * coverSize/5)
                cover.left = (i * coverSize -off) + 'px'
                cstyles.push(cover)
            }
            setCoverstyles(cstyles)
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

