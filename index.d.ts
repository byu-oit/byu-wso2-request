import { RequestPromiseOptions } from 'request-promise'

declare module 'byu-wso2-request' {
    export function setOauthSettings (clientKey: string, clientSecret: string): Promise<any>
    export function oauthHttpHeaderValue (token: string): string
    export function actingForHeader (requestObject: RequestPromiseOptions, actingForNetId: string): void
    export function request (settings: RequestPromiseOptions): Promise<any>
    export function request (settings: RequestPromiseOptions, originalJWT: string): Promise<any>
}
