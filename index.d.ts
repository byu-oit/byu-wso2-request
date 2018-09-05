import {RequestPromiseOptions} from 'request-promise'

declare module 'byu-wso2-request' {
    export function setOauthSettings(settings: OauthSettings): void;
    export function oauthHttpHeaderValue(token: string): string;
    export function actingForHeader(requestObject: RequestPromiseOptions, actingForNetId: string): void;
    export function request(settings: RequestPromiseOptions): Promise<any>;
    export function request(settings: RequestPromiseOptions, callback: () => any): any;
    export function request(settings: RequestPromiseOptions, originalJWT: string): Promise<any>;
    export function request(settings: RequestPromiseOptions, originalJWT: string, callback: () => any): any;

    export interface OauthSettings {
        clientKey: string,
        clientSecret: string,
        wellKnownUrl: string
    }
}
