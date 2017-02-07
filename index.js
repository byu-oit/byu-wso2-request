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
const byuOauth              = require('byu-wabs-oauth');
const Promise               = require('bluebird');
const request               = require('request-promise')

const co = Promise.coroutine;

const clientKey = process.env.WSO2_CLIENT_KEY || 'client-id';
const clientSecret = process.env.WSO2_CLIENT_SECRET || 'client-secret';
const wellKnownUrl = process.env.WSO2_WELLKNOWN_URL || 'https://api.byu.edu/.well-known/openid-configuration'

const oauth = byuOauth(clientKey, clientSecret, wellKnownUrl);
let   wso2OauthToken = null;

exports.oauthHttpHeader = function()
{
    return 'Bearer ' + wso2OauthToken.token;
}

exports.request = co(function (requestObject, callback)
{
    let attempts = 0;
    const maxAttemps = 2;

    while (attempts < maxAttemps)
    {
        attempts += 1;
        if (!wso2OauthToken)
        {
            wso2OauthToken = yield oauth.getClientGrantAccessToken();
        }
        if (!requestObject.hasOwnProperty('headers'))
        {
            requestObject.headers = {};
        }
        requestObject.headers.Authorization = exports.oauthHttpHeader();

        const response = yield request(requestObject);

        if (response.statusCode === 401)
        {
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
        callback(null, response);
    }
    else
    {
        return new Promise(function (resolve, reject)
        {
            resolve(response);
        })
    }

})