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
import Secret from "@tremho/coverterage"

const def = JSON.parse(fs.readFileSync(path.join(__dirname, "definition.json")).toString());

const service = new LambdaApi<any>(def,
    async (event:any) => {
        Log.Info("Entering Secrets");

        // convert this template into a value tree

        const domkeys = {
            vod: {
                key: {}
            }
        }
        for(let dom of Object.getOwnPropertyNames(domkeys)) {
            Log.Info('dom='+dom)
            for(let key of Object.getOwnPropertyNames(domkeys[dom])) {
                Log.Info('key='+dom)
                const secrets = await Secret('vod', 'key')
                Log.Info("secrets=", secrets)
                for(let p of Object.getOwnPropertyNames(secrets)) {
                    domkeys[dom][key][p] = secrets[p]
                }
            }
        }
        Log.Info("returning", {domkeys})
        const resp:any = Success(JSON.stringify(domkeys), 'text/plain')
        if(!resp.headers) resp.headers = {}
        // Add CORS Headers explicitly
        resp.headers = Object.assign(resp.headers, {
            "Access-Control-Allow-Headers" : "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,GET"
        })
        return resp

    }
)
export function start(e:any, c:any, cb:any) {
    return service.entryPoint(e, c, cb)
}
