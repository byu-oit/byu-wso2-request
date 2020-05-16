import { RequestPromiseOptions } from 'request-promise'

declare module 'byu-wso2-request' {
    export function setOauthSettings (clientKey: string, clientSecret: string): Promise<void>
    export function setOauthSettings (oauthSettings: { clientKey: string, clientSecret: string }): Promise<void>
    export function oauthHttpHeaderValue (token: string): string
    export function actingForHeader (requestObject: RequestPromiseOptions, actingForNetId: string): void
    export function getCurrentToken (): string | null
    export function request (settings: RequestPromiseOptions): Promise<any>
    export function request (settings: RequestPromiseOptions, originalJWT: string): Promise<any>
}
