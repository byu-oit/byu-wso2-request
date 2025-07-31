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

// Exported for test purposes - these should not be considered public
exports.oauth = null
exports.wso2OauthToken = null
exports.expiresTimeStamp = null

exports.setOauthSettings = async function setOauthSettings (clientKey, clientSecret, options) {
  // console.log(`Inside setOauthSettings`)
  // Allow the use of an object { clientKey, clientSecret } as first parameter
  if (clientKey instanceof Object) {
    if (clientSecret) {
      throw Error('Unexpected second parameter - If clientKey and clientSecret are provided as part of an object, only one parameter is expected')
    }
    ({ clientKey, clientSecret, ...options } = clientKey)
  }

  // Try using environment variables if clientKey/clientSecret not provided
  if (!clientKey) clientKey = process.env.WSO2_CLIENT_KEY
  if (!clientSecret) clientSecret = process.env.WSO2_CLIENT_SECRET
  const host = options != null ? options.host : process.env.WSO2_HOST || process.env.BYUAPI_DOMAIN

  if (!clientKey || !clientSecret) throw Error('Expected clientKey and clientSecret')

  exports.oauth = await byuOauth(clientKey, clientSecret, { ...host && { host } })
}

exports.oauthHttpHeaderValue = function oauthHttpHeaderValue (token) {
  return `Bearer ${token.accessToken}`
}

exports.actingForHeader = function actingForHeader (requestObject, actingForNetId) {
  if (!Object.prototype.hasOwnProperty.call(requestObject, 'headers')) {
    requestObject.headers = {}
  }
  requestObject.headers['acting-for'] = actingForNetId
}

exports.getCurrentToken = function getCurrentToken () {
  return exports.wso2OauthToken && exports.wso2OauthToken.accessToken
}

exports.request = async function request (settings, originalJWT) {
  if (exports.oauth === null) await exports.setOauthSettings() // Try using default values (from environment variables) - This gives a more helpful error if it rejects

  const defaultSettings = {
    method: 'GET',
    json: true,
    simple: true,
    encoding: 'utf8',
    headers: {
      Accept: 'application/json'
    }
  }
  // console.log(`Inside byu-wso2-request`)
  const requestObject = Object.assign(defaultSettings, settings)

  const wabs = requestObject.wabs

  if (!wabs && exports.wso2OauthToken) {
    if (exports.expiresTimeStamp) {
      const now = new Date()
      if (now > exports.expiresTimeStamp) {
        logger('Access token has expired - Revoking token')
        // TYK: no longer necessary to proactively revoke
        // await exports.oauth.revokeToken(exports.wso2OauthToken.accessToken)
        exports.wso2OauthToken = null
      }
    }
  }

  let response
  let responseError
  let attemptsMade = 0
  const maxAttempts = 3
  while (attemptsMade < maxAttempts) {
    attemptsMade++

    if (wabs) {
      requestObject.headers.Authorization = exports.oauthHttpHeaderValue(wabs.auth)
    } else {
      if (!exports.wso2OauthToken) {
        exports.wso2OauthToken = await exports.oauth.getClientGrantToken()
        const now = new Date()
        exports.expiresTimeStamp = new Date(now.getTime() + (exports.wso2OauthToken.expiresIn * 1000))
        logger(`Access Token ${exports.wso2OauthToken.accessToken} will expire: ${exports.expiresTimeStamp} ${exports.wso2OauthToken.expiresIn} seconds from: ${now}`)
      }
      requestObject.headers.Authorization = exports.oauthHttpHeaderValue(exports.wso2OauthToken)

      if (originalJWT) {
        requestObject.headers[BYU_JWT_HEADER_ORIGINAL] = originalJWT
      }
    }

    logger(`Making attempt ${attemptsMade} for:`, requestObject)
    let httpStatusCode
    try {
      responseError = null
      response = await requestPromise(requestObject)
      httpStatusCode = response.statusCode || 200
    } catch (e) {
      logger('byu-wso2-request error')
      logger(e)
      httpStatusCode = e.statusCodeError || e.statusCode || 401
      responseError = e
    }
    logger(`httpStatusCode: ${httpStatusCode}`)

    async function doRevoke () {
      if (wabs) {
        await wabs.refreshToken()
      } else if (exports.wso2OauthToken) {
        // TYK: no longer necessary to proactively revoke
        // await exports.oauth.revokeToken(exports.wso2OauthToken.accessToken)
        exports.wso2OauthToken = null
      } // Otherwise, another caller has already revoked it
    }

    switch (httpStatusCode) {
      case 401:
        logger('Detected unauthorized request.  Revoking token')
        if (responseError && responseError.message && /inactive token/i.test(`${responseError.message}`)) {
          await doRevoke()
        }
        break
      case 502:
        await sleep(300)
        break
      default:
        if (httpStatusCode >= 500) {
          if (/<ams:code>900901<\/ams:code><ams:message>Invalid Credentials<\/ams:message>/.test(`${response}`)) {
            await doRevoke()
          }
          await sleep(100)
        } else {
          // Consider these to be okay
          if (response) {
            return response
          }
          if (requestObject.simple) {
            throw (responseError)
          }
          return response
        }
    }
  }
  if (response) {
    return response
  }
  if (requestObject.simple) {
    throw (responseError)
  }
  return response
}

function sleep (ms) {
  return new Promise(function sleepyPromise (resolve) { setTimeout(resolve, ms) })
}
