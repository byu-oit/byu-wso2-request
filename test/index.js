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
/* global describe beforeEach afterEach it */

const byuWso2Request = require('../index')

const { StatusCodeError } = require('request-promise/errors')

const proxyquire = require('proxyquire')
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(sinonChai)
const { expect } = chai

describe('setOauthSettings', function () {
  let WSO2_CLIENT_KEY
  let WSO2_CLIENT_SECRET
  let byuWso2Request
  let byuWabsOauthStub

  beforeEach(() => {
    ({ WSO2_CLIENT_KEY, WSO2_CLIENT_SECRET } = process.env) // Save state before test
    byuWabsOauthStub = sinon.stub()
    byuWso2Request = proxyquire('../index', {
      'byu-wabs-oauth': byuWabsOauthStub
    })
  })

  afterEach(() => {
    sinon.restore()
    Object.assign(process.env, { WSO2_CLIENT_KEY, WSO2_CLIENT_SECRET }) // Restore previous state
  })

  it('uses environment variables by default', async () => {
    // These will get restored after the test
    process.env.WSO2_CLIENT_KEY = 'someKey'
    process.env.WSO2_CLIENT_SECRET = 'someSecret'

    await byuWso2Request.setOauthSettings()
    expect(byuWabsOauthStub).to.be.calledWith('someKey', 'someSecret')
  })

  it('uses user-provided clientKey and clientSecret', async () => {
    // These will get restored after the test
    process.env.WSO2_CLIENT_KEY = 'someKey'
    process.env.WSO2_CLIENT_SECRET = 'someSecret'

    await byuWso2Request.setOauthSettings('someOtherKey', 'someOtherSecret')
    expect(byuWabsOauthStub).to.be.calledWith('someOtherKey', 'someOtherSecret')
  })

  describe('(legacy) uses user-provided clientKey and clientSecret when provided as an object', function () {
    it('uses the correct clientKey and clientSecret', async () => {
      // These will get restored after the test
      process.env.WSO2_CLIENT_KEY = 'someKey'
      process.env.WSO2_CLIENT_SECRET = 'someSecret'

      await byuWso2Request.setOauthSettings({ clientKey: 'someOtherKey', clientSecret: 'someOtherSecret' })
      expect(byuWabsOauthStub).to.be.calledWith('someOtherKey', 'someOtherSecret')
    })

    it('doesn\'t reject if wellKnownUrl is provided as part of the object', async () => {
      await byuWso2Request.setOauthSettings({ clientKey: 'someOtherKey', clientSecret: 'someOtherSecret', wellKnownUrl: 'blah' })
      expect(byuWabsOauthStub).to.be.calledWith('someOtherKey', 'someOtherSecret')
      // There's an implicit we-expect-this-not-to-reject
    })

    it('rejects if a second parameter is provided when the first parameter is an options object', async () => {
      const someGarbageVariable = true
      try {
        await byuWso2Request.setOauthSettings({ clientKey: 'someOtherKey', clientSecret: 'someOtherSecret' }, someGarbageVariable)
      } catch (e) {
        expect(e.message).to.equal('Unexpected second parameter - If clientKey and clientSecret are provided as part of an object, only one parameter is expected')
      }
      expect(byuWabsOauthStub.callCount).to.equal(0)
    })
  })

  it('sets exports.oauth to a new instance of byu-wabs-oauth (asynchronously)', async () => {
    const fakeOauthObject = {}
    byuWabsOauthStub.resolves(fakeOauthObject)
    await byuWso2Request.setOauthSettings('someKey', 'someSecret')
    expect(byuWso2Request.oauth).to.equal(fakeOauthObject)
  })
})

describe('oauthHttpHeaderValue', function () {
  it('returns `Bearer ${token.accessToken}`', () => { // eslint-disable-line no-template-curly-in-string
    const actual = byuWso2Request.oauthHttpHeaderValue({ accessToken: 'fakeToken' })
    expect(actual).to.equal('Bearer fakeToken')
  })
})

describe('actingForHeader', function () {
  it('sets the acting-for header on the provided request object', () => {
    const requestObject1 = {
      url: 'https://api.byu.edu:443/echo/v1/echo/test'
    }
    byuWso2Request.actingForHeader(requestObject1, 'fakenetid')
    expect(requestObject1.headers['acting-for']).to.equal('fakenetid')

    const requestObject2 = {
      url: 'https://api.byu.edu:443/echo/v1/echo/test',
      headers: {
        'acting-for': 'othernetid'
      }
    }
    byuWso2Request.actingForHeader(requestObject2, 'fakenetid')
    expect(requestObject2.headers['acting-for']).to.equal('fakenetid')
  })
})

describe('request', function () {
  let byuWso2Request
  let byuWabsOauthStub
  let getClientGrantTokenStub
  let revokeTokenStub
  let requestPromiseStub
  const fakeTimestamp = Date.now() + 3600
  const fakeToken = {
    accessToken: 'obviouslyfaketoken',
    expiresAt: fakeTimestamp,
    expiresIn: 3600
  }
  const fakeExpiredTimestamp = Date.now() - 3600
  const fakeExpiredToken = {
    accessToken: 'expired',
    expiresAt: fakeExpiredTimestamp,
    expiresIn: 3600
  }

  beforeEach(() => {
    getClientGrantTokenStub = sinon.stub().resolves(fakeToken)
    revokeTokenStub = sinon.stub().resolves()
    byuWabsOauthStub = sinon.stub()
    requestPromiseStub = sinon.stub()
    byuWso2Request = proxyquire('../index', {
      'byu-wabs-oauth': byuWabsOauthStub,
      'request-promise': requestPromiseStub
    })
  })

  afterEach(() => {
    sinon.restore()
  })

  it('initializes oauth settings if not already done', async () => {
    byuWabsOauthStub.resolves({ getClientGrantToken: getClientGrantTokenStub, revokeToken: revokeTokenStub })
    requestPromiseStub.resolves({})
    const setOauthSettingsSpy = sinon.spy(byuWso2Request, 'setOauthSettings')
    const requestObject = {
      url: 'https://api.byu.edu:443/echo/v1/echo/test'
    }
    await byuWso2Request.request(requestObject)

    expect(setOauthSettingsSpy.callCount).to.be.above(0)
  })

  describe('calls request-promise', function () {
    beforeEach(() => {
      byuWabsOauthStub.resolves({ getClientGrantToken: getClientGrantTokenStub, revokeToken: revokeTokenStub })
    })

    it('using authorization', async () => {
      requestPromiseStub.resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)

      const actualRequestPromiseOptions = requestPromiseStub.args[0][0]
      expect(actualRequestPromiseOptions.headers.Authorization).to.equal('Bearer obviouslyfaketoken')
    })

    it('with an original JWT (when provided)', async () => {
      requestPromiseStub.resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject, 'fakeoriginaljwt')

      const actualRequestPromiseOptions = requestPromiseStub.args[0][0]
      expect(actualRequestPromiseOptions.headers['x-jwt-assertion-original']).to.equal('fakeoriginaljwt')
    })

    it('with some default settings', async () => {
      requestPromiseStub.resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)

      const actualRequestPromiseOptions = requestPromiseStub.args[0][0]
      expect(actualRequestPromiseOptions.method).to.equal('GET')
      expect(actualRequestPromiseOptions.json).to.equal(true)
      expect(actualRequestPromiseOptions.simple).to.equal(true)
      expect(actualRequestPromiseOptions.encoding).to.equal('utf8')
      expect(actualRequestPromiseOptions.headers.Accept).to.equal('application/json')
    })

    it('with provided settings when default settings are overwritten', async () => {
      requestPromiseStub.resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test',
        method: 'POST',
        json: false,
        simple: false
      }
      await byuWso2Request.request(requestObject)

      const actualRequestPromiseOptions = requestPromiseStub.args[0][0]
      expect(actualRequestPromiseOptions.method).to.equal('POST')
      expect(actualRequestPromiseOptions.json).to.equal(false)
      expect(actualRequestPromiseOptions.simple).to.equal(false)
    })

    it('with additional settings (when provided)', async () => {
      requestPromiseStub.resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test',
        someProperty: true
      }
      await byuWso2Request.request(requestObject)

      const actualRequestPromiseOptions = requestPromiseStub.args[0][0]
      expect(actualRequestPromiseOptions.someProperty).to.equal(true)
    })

    it('when everything is valid', async () => {
      requestPromiseStub.resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)

      expect(requestPromiseStub.callCount).to.be.above(0)
    })

    it('when a method is provided', async () => {
      requestPromiseStub.resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test',
        method: 'DELETE'
      }
      await byuWso2Request.request(requestObject)

      expect(requestPromiseStub.callCount).to.be.above(0)
    })

    it('when the domain is invalid', async () => {
      requestPromiseStub.resolves({})
      const requestObject = {
        url: 'https://api.byuasdfldkjsadfiojsdaflk/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)

      expect(requestPromiseStub.callCount).to.be.above(0)
    })

    it('when the path is invalid', async () => {
      requestPromiseStub.resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/this/doesn\'t/actually/exist'
      }
      await byuWso2Request.request(requestObject)

      expect(requestPromiseStub.callCount).to.be.above(0)
    })

    it('and rejects with what request-promise rejects', async () => {
      const someError = Error('Some Error')
      requestPromiseStub.rejects(someError)
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/this/doesn\'t/actually/exist'
      }
      try {
        await byuWso2Request.request(requestObject)
      } catch (e) {
        expect(e).to.equal(someError)
        return
      }
      throw Error('Should not get here')
    })
  })

  describe('works with wabs', function () {
    beforeEach(() => {
      byuWabsOauthStub.resolves({ getClientGrantToken: getClientGrantTokenStub, revokeToken: revokeTokenStub })
    })

    it('by using tokens from wabs', async () => {
      requestPromiseStub.resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test',
        wabs: {
          auth: { accessToken: 'sometokenthatwabshad' }
        }
      }
      await byuWso2Request.request(requestObject)

      const actualRequestPromiseOptions = requestPromiseStub.args[0][0]
      expect(actualRequestPromiseOptions.headers.Authorization).to.equal('Bearer sometokenthatwabshad')
    })

    it('by using wabs to refresh tokens', async () => {
      // This is a situation where the token should get revoked and the call should be retried
      // ... but in this case, we have a 'wabs' property on our requestObject
      requestPromiseStub.onFirstCall().resolves({ statusCode: 403 }).onSecondCall().resolves({})
      const wabsRefreshTokenStub = sinon.stub()
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test',
        wabs: {
          auth: { accessToken: 'fakeaccesstoken' },
          refreshToken: wabsRefreshTokenStub
        }
      }
      await byuWso2Request.request(requestObject)

      expect(revokeTokenStub.callCount).to.equal(0) // Should not use these
      expect(getClientGrantTokenStub.callCount).to.equal(0)
      expect(wabsRefreshTokenStub.callCount).to.equal(1) // Use this instead
      expect(requestPromiseStub.callCount).to.be.above(1) // Should still do the retry :)
    })
  })

  it('revokes an expired token before even making the request', async () => {
    try {
      const revokeTokenStubWithAssertions = sinon.stub().callsFake(async accessToken => {
        expect(accessToken).to.equal('expired')
        expect(requestPromiseStub.callCount).to.equal(0) // Revoke before any requests are made
      })
      byuWabsOauthStub.resolves({
        getClientGrantToken: getClientGrantTokenStub,
        revokeToken: revokeTokenStubWithAssertions
      })
      requestPromiseStub.resolves({})

      // Initialize oauth stuff
      await byuWso2Request.setOauthSettings('fakeKey', 'fakeSecret')
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)
      requestPromiseStub.resetHistory()

      // "Expire" the current token
      byuWso2Request.wso2OauthToken = fakeExpiredToken
      byuWso2Request.expiresTimeStamp = fakeExpiredTimestamp

      await byuWso2Request.request(requestObject)
      expect(revokeTokenStubWithAssertions.callCount).to.be.above(0) // Make sure our assertions that we care about actually got checked
    } finally {
      // Restore some values used just for this test
      byuWso2Request.wso2OauthToken = fakeExpiredToken
      byuWso2Request.expiresTimeStamp = fakeTimestamp
    }
  })

  it('tries to get a new token if no current valid token exists before making a call (or if the token was revoked)', async () => {
    const getClientGrantTokenStubWithAssertion = sinon.stub().callsFake(async () => {
      expect(requestPromiseStub.callCount).to.equal(0) // Get token before any requests are made
      return fakeToken
    })
    byuWabsOauthStub.resolves({
      getClientGrantToken: getClientGrantTokenStubWithAssertion,
      revokeToken: revokeTokenStub
    })
    requestPromiseStub.resolves({})

    // Initialize oauth stuff
    await byuWso2Request.setOauthSettings('fakeKey', 'fakeSecret')
    const requestObject = {
      url: 'https://api.byu.edu:443/echo/v1/echo/test'
    }
    await byuWso2Request.request(requestObject)
    requestPromiseStub.resetHistory()

    // Revoke existing token
    await byuWso2Request.oauth.revokeToken(byuWso2Request.wso2OauthToken.accessToken)
    byuWso2Request.wso2OauthToken = null

    await byuWso2Request.request(requestObject)
    expect(getClientGrantTokenStubWithAssertion.callCount).to.be.above(0) // Make sure our assertion that we care about actually got checked
  })

  describe('retries when simple=true', function () {
    it('on a 400 status code, after revoking the token', async () => {
      const revokeTokenStubWithAssertions = sinon.stub().callsFake(async () => {
        expect(requestPromiseStub.callCount).to.equal(1) // Revoke after first call
      })
      byuWabsOauthStub.resolves({ getClientGrantToken: getClientGrantTokenStub, revokeToken: revokeTokenStubWithAssertions })
      requestPromiseStub.onFirstCall().rejects(new StatusCodeError(400, '', {}, {})).onSecondCall().resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)

      expect(requestPromiseStub.callCount).to.be.above(1)
    })

    it('on a 401 status code, after revoking the token', async () => {
      const revokeTokenStubWithAssertions = sinon.stub().callsFake(async () => {
        expect(requestPromiseStub.callCount).to.equal(1) // Revoke after first call
      })
      byuWabsOauthStub.resolves({ getClientGrantToken: getClientGrantTokenStub, revokeToken: revokeTokenStubWithAssertions })
      requestPromiseStub.onFirstCall().rejects(new StatusCodeError(401, '', {}, {})).onSecondCall().resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)

      expect(requestPromiseStub.callCount).to.be.above(1)
    })

    it('on a 403 status code, after revoking the token', async () => {
      const revokeTokenStubWithAssertions = sinon.stub().callsFake(async () => {
        expect(requestPromiseStub.callCount).to.equal(1) // Revoke after first call
      })
      byuWabsOauthStub.resolves({ getClientGrantToken: getClientGrantTokenStub, revokeToken: revokeTokenStubWithAssertions })
      requestPromiseStub.onFirstCall().rejects(new StatusCodeError(403, '', {}, {})).onSecondCall().resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)

      expect(requestPromiseStub.callCount).to.be.above(1)
    })

    it('on a 502 status code, after waiting 300ms', async () => {
      byuWabsOauthStub.resolves({ getClientGrantToken: getClientGrantTokenStub, revokeToken: revokeTokenStub })
      let firstCallTime = 0
      let secondCallTime = 0
      requestPromiseStub
        .onFirstCall().callsFake(async () => {
          firstCallTime = Date.now()
          throw new StatusCodeError(502, '', {}, {})
        })
        .onSecondCall().callsFake(async () => {
          secondCallTime = Date.now()
          return {}
        })
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)

      expect(requestPromiseStub.callCount).to.be.above(1)
      expect(secondCallTime).to.be.above(firstCallTime + 299)
    })

    it('on a >=500 status code (other than 502), after waiting 100ms', async () => {
      byuWabsOauthStub.resolves({ getClientGrantToken: getClientGrantTokenStub, revokeToken: revokeTokenStub })
      let firstCallTime = 0
      let secondCallTime = 0
      requestPromiseStub
        .onFirstCall().callsFake(async () => {
          firstCallTime = Date.now()
          throw new StatusCodeError(504, '', {}, {})
        })
        .onSecondCall().callsFake(async () => {
          secondCallTime = Date.now()
          return {}
        })
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)

      expect(requestPromiseStub.callCount).to.be.above(1)
      expect(secondCallTime).to.be.above(firstCallTime + 99)
    })
  })

  describe('retries when simple=false', function () {
    it('on a 400 status code, after revoking the token', async () => {
      const revokeTokenStubWithAssertions = sinon.stub().callsFake(async () => {
        expect(requestPromiseStub.callCount).to.equal(1) // Revoke after first call
      })
      byuWabsOauthStub.resolves({ getClientGrantToken: getClientGrantTokenStub, revokeToken: revokeTokenStubWithAssertions })
      requestPromiseStub.onFirstCall().resolves({ statusCode: 400 }).onSecondCall().resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)

      expect(requestPromiseStub.callCount).to.be.above(1)
    })

    it('on a 401 status code, after revoking the token', async () => {
      const revokeTokenStubWithAssertions = sinon.stub().callsFake(async () => {
        expect(requestPromiseStub.callCount).to.equal(1) // Revoke after first call
      })
      byuWabsOauthStub.resolves({ getClientGrantToken: getClientGrantTokenStub, revokeToken: revokeTokenStubWithAssertions })
      requestPromiseStub.onFirstCall().resolves({ statusCode: 401 }).onSecondCall().resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)

      expect(requestPromiseStub.callCount).to.be.above(1)
    })

    it('on a 403 status code, after revoking the token', async () => {
      const revokeTokenStubWithAssertions = sinon.stub().callsFake(async () => {
        expect(requestPromiseStub.callCount).to.equal(1) // Revoke after first call
      })
      byuWabsOauthStub.resolves({ getClientGrantToken: getClientGrantTokenStub, revokeToken: revokeTokenStubWithAssertions })
      requestPromiseStub.onFirstCall().resolves({ statusCode: 403 }).onSecondCall().resolves({})
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)

      expect(requestPromiseStub.callCount).to.be.above(1)
    })

    it('on a 502 status code, after waiting 300ms', async () => {
      byuWabsOauthStub.resolves({ getClientGrantToken: getClientGrantTokenStub, revokeToken: revokeTokenStub })
      let firstCallTime = 0
      let secondCallTime = 0
      requestPromiseStub
        .onFirstCall().callsFake(async () => {
          firstCallTime = Date.now()
          return { statusCode: 502 }
        })
        .onSecondCall().callsFake(async () => {
          secondCallTime = Date.now()
          return {}
        })
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)

      expect(requestPromiseStub.callCount).to.be.above(1)
      expect(secondCallTime).to.be.above(firstCallTime + 299)
    })

    it('on a >=500 status code (other than 502), after waiting 100ms', async () => {
      byuWabsOauthStub.resolves({ getClientGrantToken: getClientGrantTokenStub, revokeToken: revokeTokenStub })
      let firstCallTime = 0
      let secondCallTime = 0
      requestPromiseStub
        .onFirstCall().callsFake(async () => {
          firstCallTime = Date.now()
          return { statusCode: 504 }
        })
        .onSecondCall().callsFake(async () => {
          secondCallTime = Date.now()
          return {}
        })
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test'
      }
      await byuWso2Request.request(requestObject)

      expect(requestPromiseStub.callCount).to.be.above(1)
      expect(secondCallTime).to.be.above(firstCallTime + 99)
    })
  })

  describe('resolves with what request-promise resolves', function () {
    beforeEach(() => {
      byuWabsOauthStub.resolves({ getClientGrantToken: getClientGrantTokenStub, revokeToken: revokeTokenStub })
    })

    const expectedBody = { someData: true }
    const expectedFull200 = {
      statusCode: 200,
      body: expectedBody
    }
    const expectedFull400 = {
      statusCode: 400,
      body: expectedBody
    }

    it('on a 200 when resolveWithFullResponse=false', async () => {
      requestPromiseStub.resolves(expectedBody)
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test',
        resolveWithFullResponse: false
      }
      const actual = await byuWso2Request.request(requestObject)
      expect(actual).to.deep.equal({ someData: true })
    })

    it('on a 200 when resolveWithFullResponse=true', async () => {
      requestPromiseStub.resolves(expectedFull200)
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test',
        resolveWithFullResponse: false
      }
      const actual = await byuWso2Request.request(requestObject)
      expect(actual).to.deep.equal({
        statusCode: 200,
        body: { someData: true }
      })
    })

    // simple=false is needed because otherwise 400s would cause request-promise to reject
    it('on a 400 when simple=false and resolveWithFullResponse=false', async () => {
      requestPromiseStub.resolves(expectedBody)
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test',
        simple: false,
        resolveWithFullResponse: false
      }
      const actual = await byuWso2Request.request(requestObject)
      expect(actual).to.deep.equal({ someData: true })
    })

    // simple=false is needed because otherwise 400s would cause request-promise to reject
    it('on a 400 when simple=false and resolveWithFullResponse=true', async () => {
      requestPromiseStub.resolves(expectedFull400)
      const requestObject = {
        url: 'https://api.byu.edu:443/echo/v1/echo/test',
        simple: false,
        resolveWithFullResponse: true
      }
      const actual = await byuWso2Request.request(requestObject)
      expect(actual).to.deep.equal({
        statusCode: 400,
        body: { someData: true }
      })
    })
  })
})
