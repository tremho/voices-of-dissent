/*
Create the UI for account info
 - log in (only if no identity)
 (if identity):
 - avatar (none, placeholder, found)
 - name, email or id
 - log out
 */
import React from 'react'
import {Button} from "@mui/material";
import {LoadingSpinner} from "../LoadingSpinner";
import ServiceEndpoint from "../../../commonLib/ServiceEndpoint";
import {getAssetUrl} from "../../../commonLib/ServiceEndpoint";


export function AccountControl(props) {

    const identity:any = props.identity ?? {}

    if(identity.userIdentity) {
        return (
            <>
                <LogoutAction logout={props.logout} identity={props.identity}/>
            </>
        )
    }

    return (
        <>
            <LoginAction login={props.login} identity={props.identity}/>
        </>
    )
}


function LoginAction(props) {

    function doLogin() {
        // console.log("Doing login")
        props.login()
    }
    const buttonPlacement:any = {
        height: "50px",
        marginLeft: "30px"
    }

    let login = "Log\u00A0In"
    return (
        <>
            <Avatar identity={props.identity} />
            <Button style={buttonPlacement} onClick={doLogin}>{login}</Button>
        </>
    )
}

function LogoutAction(props) {

    function doLogout() {
        // console.log("Doing logout")
        props.logout()
        location.href = ServiceEndpoint('/')
    }
    const buttonPlacement:any = {
        height: "50px"
    }

    let logout = "Log\u00A0Out"
    return (
        <>
            <Avatar identity={props.identity} />
            <Button style={buttonPlacement} onClick={doLogout}>{logout}</Button>
        </>
    )
}


const avatarContainer:any = {
    position: "relative",
    left: "20px",
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
}
const avatarBackground:any = {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "black"
}
const avatarImage:any = {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "cover"
}
const namePlacement:any = {
    width: "120%",
    position: "relative",
}
function Avatar(props) {

    if(!props.identity) return

    const [idInfo, setIdInfo] = React.useState(null)

    async function asyncUseEffect() {
        if(!idInfo?.name) {
            const info = await extractIdentityInfo(props.identity)
            setIdInfo(info)
        }
    }
    React.useEffect(() => {
        asyncUseEffect()
    })
    if(idInfo) {
        if (!props.identity?.userIdentity) idInfo.avatar = getAssetUrl('images/no-login.png')
        else if (!idInfo.avatar) idInfo.avatar = getAssetUrl('images/no-avatar.png')

        const colors: string[] = [
            'aqua',
            'black',
            'blue',
            'blueviolet',
            'cadetblue',
            'crimson',
            'darkblue',
            'darkgrey',
            'darkmagenta',
            'deeppink',
            'dodgerblue',
            'firebrick',
            'forestgreen',
            'goldenrod',
            'gray',
            'green',
            'indigo',
            'lightseagreen',
            'maroon',
            'navy',
            'orangered',
            'olivedrab',
            'purple',
            'red',
            'saddlebrown',
            'seagreen',
            'steelblue'
        ]


        const n = idInfo.name.length

        let c = colors[n]
        // console.log("Avatar color=", n, c)
        avatarBackground.backgroundColor = c

        // console.log("Avatar color=", n, colors[n], c, avatarBackground.backgroundColor)


        return (<>
            <div>
                <div style={avatarContainer}>
                    <div style={avatarBackground}/>
                    <img style={avatarImage} src={idInfo.avatar} alt={"User Avatar"}/>
                </div>
                <p style={namePlacement}> {idInfo.name} </p>
            </div>
        </>)
    }
}

async function extractIdentityInfo(identity:any) {
    let out = {name:'', avatar: '', artistName: ''}
    let name = ''
    let email = ''
    let provider = ''
    let avatar = ''
    let apple = identity?.providerData?.apple
    if(apple) {
        provider = 'apple'
        if(!email && apple.email) email = apple.email
    }
    let google = identity?.providerData?.google
    if(google) {
        provider = 'google'
        if(!name && google.name_full) name = google.name_full
        if(!email && google.email) email = google.email
        if(!avatar && google.picture) avatar = google.picture
    }
    let facebook = identity?.providerData?.facebook
    if(facebook) {
        provider = 'facebook'
        if(!name && facebook.name_full) name = facebook.name_full
        if(!email && facebook.email) email = facebook.email
        if(!avatar && facebook.picture) avatar = facebook.picture.data.url
    }
    if(name) {
        out.name = name ?? ''
    } else {
        if(email) {
            out.name = email
        } else {
            out.name = identity?.userIdentity ?? ''
            if(provider) out.name += " ("+provider+")"
        }
    }
    if(avatar) out.avatar = avatar

    // record the email and the default name for this user. If they have set an artist name, we'll get that back as name
    console.log("fetch info for default")
    const aiResp = await fetch(ServiceEndpoint(`/info/${identity?.userIdentity}/${out.name}/${email?email:'~'}`))
    const addInfo:any = await aiResp.json()
    out.artistName = addInfo.artistName

    // console.log("extracted info = ", out)
    return out;
}