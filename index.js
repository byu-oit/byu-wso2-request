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

"use strict";

const logger                = require("debug")("byu-wso2-request")
const byuOauth              = require('byu-wabs-oauth');
const Promise               = require('bluebird');
const request               = require('request-promise')

const co = Promise.coroutine;

const clientKey = process.env.WSO2_CLIENT_KEY || 'client-id';
const clientSecret = process.env.WSO2_CLIENT_SECRET || 'client-secret';
const wellKnownUrl = process.env.WSO2_WELLKNOWN_URL || 'https://api.byu.edu/.well-known/openid-configuration'

const oauth = byuOauth(clientKey, clientSecret, wellKnownUrl);
let wso2OauthToken = null;
let expiresTimeStamp = null;

exports.oauthHttpHeader = function(token)
{
    return 'Bearer ' + token.accessToken;
}

exports.request = co(function* (requestObject, callback)
{
    let     attempts = 0;
    const   maxAttemps = 2;
    let     response = {};
    let     err = null;

    if (expiresTimeStamp)
    {
        let now = new Date()
        if ( now > expiresTimeStamp)
        {
            logger('Access token has expired - Revoking token');
            yield oauth.revokeTokens(wso2OauthToken.accessToken);
            wso2OauthToken = null;
        }
    }
    while (attempts < maxAttemps)
    {
        attempts += 1;
        if (!wso2OauthToken)
        {
            wso2OauthToken = yield oauth.getClientGrantAccessToken(true);
            let now = new Date()
            expiresTimeStamp = new Date(now.getTime() + (wso2OauthToken.expiresIn * 1000));
            logger('Access Token ', wso2OauthToken.accessToken, 'will expire:', expiresTimeStamp, wso2OauthToken.expiresIn, ' seconds from:', now)
        }
        if (!requestObject.hasOwnProperty('headers'))
        {
            requestObject.headers = {};
        }
        requestObject.headers.Authorization = exports.oauthHttpHeader(wso2OauthToken);

        logger('Making attempt', attempts, 'for:', requestObject);
        try
        {
            response = yield request(requestObject);
        }
        catch (e)
        {
            logger("byu-wso2-request error");
            logger(e);
            if (e.hasOwnProperty('response'))
            {
                response = e.response;
            }
            else
            {
                response = {statusCode: 500, body: {}}
            }
            err = e
        }
        logger('response.statusCode:', response.statusCode);
        logger('response.body', response.body);

        if (response.statusCode === 401)
        {
            logger('Detected unauthorized request.  Revoking token');
            yield oauth.revokeTokens(wso2OauthToken.accessToken);
            wso2OauthToken = null;
        }
        else
        {
            break;
        }
    }

    if (callback)
    {
        callback(err, response);
    }
    else
    {
        return new Promise.resolve(response);
    }
})