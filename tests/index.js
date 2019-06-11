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
/* global describe it */

describe('setOauthSettings', function () {
  it('uses environment variables by default')
  it('uses user-provided clientKey and clientSecret')
  it('sets exports.oauth to a new instance of byu-wabs-oauth (asynchronously)')
})

// TODO: Should this even be part of our public contract?
describe('oauthHttpHeaderValue', function () {
  it('returns `Bearer ${token.accessToken}`') // eslint-disable-line no-template-curly-in-string
})

// TODO: Should this even be part of our public contract?
describe('actingForHeader', function () {
  it('sets the acting-for header on the provided request object')
})

describe('request', function () {
  it('initializes oauth settings if not already done')
  describe('calls request-promise', function () {
    it('with some default settings')
    it('with provided settings when default settings are overwritten')
    it('when everything is valid')
    it('when a method is provided')
    it('when the domain is invalid')
    it('when the path is invalid')
  })
  describe('works with wabs', function () {
    it('by using wabs to revoke tokens')
    it('by using wabs to refresh tokens')
  })
  it('revokes an expired token before even making the request')
  it('tries to get a new token if no current valid token exists before making a call (or if the token was revoked)')
  it('makes the call using authorization')
  it('passes along an original JWT if provided')
  describe('retries', function () {
    it('on a 400 status code, after revoking the token')
    it('on a 401 status code, after revoking the token')
    it('on a 403 status code, after revoking the token')
    it('on a 502 status code, after waiting 300ms')
    it('on a >=500 status code (other than 502), after waiting 100ms')
  })
})
