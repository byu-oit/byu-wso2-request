/*
 * Copyright 2016 Brigham Young University
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

"use strict"

const logger                = require("debug")("byu-wso2-request")
const byuOauth              = require('byu-wabs-oauth')
const Promise               = require('bluebird')
const request               = require('request-promise')

const co = Promise.coroutine

const clientKey = process.env.WSO2_CLIENT_KEY || 'client-id'
const clientSecret = process.env.WSO2_CLIENT_SECRET || 'client-secret'
const wellKnownUrl = process.env.WSO2_WELLKNOWN_URL || 'well-known-url'

const oauth = byuOauth(clientKey, clientSecret, wellKnownUrl)
let wso2OauthToken = null
let expiresTimeStamp = null

const BYU_JWT_HEADER_CURRENT = 'x-jwt-assertion'
const BYU_JWT_HEADER_ORIGINAL = 'x-jwt-assertion-original'

function sleep(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

exports.oauthHttpHeaderValue = function(token)
{
    return 'Bearer ' + token.accessToken
}

exports.actingForHeader = function(requestObject, actingForNetId)
{
    if (!requestObject.hasOwnProperty('headers'))
    {
        requestObject.headers = {}
    }
    requestObject.headers["acting-for"] = actingForNetId
}

/**
 * params requestObject  forwards the request object onto request-promise,  optional key can be wabs
 *          if the wabs key is present then the authtoken in the wabs key is used.
 * params callback
 * @type {Function}
 */
exports.request = co(function* (requestObject, originalJWT, callback)
{
    //intialization
    if ((typeof originalJWT === "function"))
    {
        callback = originalJWT
        originalJWT = null
        logger("second parameter is the callback - no original JWT")
    }
    let attempts = 0
    const maxAttemps = 3
    let response = {}
    let httpStatusCode = 200
    let err = null
    const wabs = requestObject.wabs

    //check to see if a wabs key is present
    if (!wabs)
    {
        if (expiresTimeStamp)
        {
            let now = new Date()
            if (now > expiresTimeStamp)
            {
                logger('Access token has expired - Revoking token')
                yield oauth.revokeTokens(wso2OauthToken.accessToken)
                wso2OauthToken = null
            }
        }
    }
    wso2Retry:
    while (attempts < maxAttemps)
    {
        err = null
        attempts += 1

        if (!requestObject.hasOwnProperty('headers'))
        {
            requestObject.headers = {}
        }

        if (wabs)
        {
            requestObject.headers.Authorization = exports.oauthHttpHeaderValue(wabs.auth)
        }
        else
        {
            if (!wso2OauthToken)
            {
                wso2OauthToken = yield oauth.getClientGrantAccessToken(true)
                let now = new Date()
                expiresTimeStamp = new Date(now.getTime() + (wso2OauthToken.expiresIn * 1000))
                logger('Access Token ', wso2OauthToken.accessToken, 'will expire:', expiresTimeStamp, wso2OauthToken.expiresIn, ' seconds from:', now)
            }
            requestObject.headers.Authorization = exports.oauthHttpHeaderValue(wso2OauthToken)

            if (originalJWT)
            {
                requestObject.headers[BYU_JWT_HEADER_ORIGINAL] = originalJWT
            }
        }

        logger('Making attempt', attempts, 'for:', requestObject)
        try
        {
            response = yield request(requestObject)
            //set the httpStatusCode to 200 if the resolveWithFullResponse option was false
            httpStatusCode = response.statusCode || 200
        }
        catch (e)
        {
            logger("byu-wso2-request error")
            logger(e)
            if (e.hasOwnProperty('response'))
            {
                response = e.response || {}
            }
            else
            {
                response = {statusCode: 500, body: {}}
            }
            httpStatusCode = response.statusCode || 500
            err = e
        }
        logger('httpStatusCode:', httpStatusCode)

        switch (httpStatusCode)
        {
            case 403:
            case 401:
            case 400:
                logger('Detected unauthorized request.  Revoking token')
                if (wabs)
                {
                    wabs.request.refreshTokens()
                }
                else
                {
                    yield oauth.revokeTokens(wso2OauthToken.accessToken)
                    wso2OauthToken = null
                }
                break
            case 502:
                yield sleep(300)
                break
            default:
                if (httpStatusCode >= 400)
                {
                    yield sleep(100)
                }
                else
                {
                    //consider these to be okay.
                    break wso2Retry
                }
        }
    }

    if (callback)
    {
        callback(err, response)
    }
    else
    {
        if (err)
        {
            return new Promise.reject(err)
        }
        return new Promise.resolve(response)
    }
})