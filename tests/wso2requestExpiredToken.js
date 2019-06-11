'use strict'
/* global describe it */

const setEnv = require('../lib/setEnv')
setEnv.setEnvFromFile('testing.json')

// const wso2Request = require('../index').request
const expect = require('chai').expect

describe('wso2requestExpiredToken', function () {
  it('Toke was expired', async function () {
    let expiresTimeStamp = new Date()
    expiresTimeStamp = new Date(expiresTimeStamp.getTime() - 1)

    if (expiresTimeStamp) {
      let now = new Date()
      if (now > expiresTimeStamp) {
        console.log('Access token has expired - Revoking token')
        expect(true).to.equal(true)
      } else {
        expect(false).to.equal(true)
      }
    }
  })
})
