/**
 *  @license
 *    Copyright 2019 Brigham Young University
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 **/
'use strict'
const logger = require('debug')('byu-wso2-request')
const byuOauth = require('byu-wabs-oauth')
const requestPromise = require('request-promise')
const { BYU_JWT_HEADER_ORIGINAL } = require('byu-jwt')

let oauth = null
let wso2OauthToken = null
let expiresTimeStamp = null

exports.setOauthSettings = async function setOauthSettings (clientKey = process.env.WSO2_CLIENT_KEY, clientSecret = process.env.WSO2_CLIENT_SECRET) {
  if (!clientKey || !clientSecret) throw Error('Expected clientKey and clientSecret')
  oauth = await byuOauth(clientKey, clientSecret)
}

exports.oauthHttpHeaderValue = function oauthHttpHeaderValue (token) {
  return `Bearer ${token.accessToken}`
}

exports.actingForHeader = function actingForHeader (requestObject, actingForNetId) {
  if (!requestObject.hasOwnProperty('headers')) {
    requestObject.headers = {}
  }
  requestObject.headers['acting-for'] = actingForNetId
}

exports.request = async function request (settings, originalJWT) {
  if (oauth === null) await exports.setOauthSettings() // Try using default values (from environment variables) - This gives a more helpful error if it rejects

  const defaultSettings = {
    method: 'GET',
    json: true,
    simple: true,
    encoding: 'utf8',
    headers: {
      Accept: 'application/json'
    }
  }
  const requestObject = Object.assign(defaultSettings, settings)

  const wabs = requestObject.wabs

  if (!wabs && wso2OauthToken) {
    if (expiresTimeStamp) {
      const now = new Date()
      if (now > expiresTimeStamp) {
        logger('Access token has expired - Revoking token')
        await oauth.revokeToken(wso2OauthToken.accessToken)
        wso2OauthToken = null
      }
    }
  }

  let response
  let attemptsMade = 0
  const maxAttempts = 3
  while (attemptsMade < maxAttempts) {
    attemptsMade++

    if (wabs) {
      requestObject.headers.Authorization = exports.oauthHttpHeaderValue(wabs.auth)
    } else {
      if (!wso2OauthToken) {
        wso2OauthToken = await oauth.getClientGrantToken()
        const now = new Date()
        expiresTimeStamp = new Date(now.getTime() + (wso2OauthToken.expiresIn * 1000))
        logger(`Access Token ${wso2OauthToken.accessToken} will expire: ${expiresTimeStamp} ${wso2OauthToken.expiresIn} seconds from: ${now}`)
      }
      requestObject.headers.Authorization = exports.oauthHttpHeaderValue(wso2OauthToken)

      if (originalJWT) {
        requestObject.headers[BYU_JWT_HEADER_ORIGINAL] = originalJWT
      }
    }

    logger(`Making attempt ${attemptsMade} for:`, requestObject)
    let httpStatusCode
    try {
      response = await requestPromise(requestObject)
      httpStatusCode = response.statusCode || 200
    } catch (e) {
      logger('byu-wso2-request error')
      logger(e)
      throw e
    }
    logger(`httpStatusCode: ${httpStatusCode}`)

    switch (httpStatusCode) {
      case 403:
      case 401:
      case 400:
        logger('Detected unauthorized request.  Revoking token')
        if (wabs) {
          await wabs.refreshToken()
        } else {
          await oauth.revokeToken(wso2OauthToken.accessToken)
          wso2OauthToken = null
        }
        break
      case 502:
        await sleep(300)
        break
      default:
        if (httpStatusCode >= 500) {
          await sleep(100)
        } else {
          // Consider these to be okay
          return response
        }
    }
  }
  return response
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
