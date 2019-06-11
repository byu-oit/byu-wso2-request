/**
 * Created by martin on 4/24/17.
 */

'use strict'
/* global describe it */

const setEnv = require('../lib/setEnv')
setEnv.setEnvFromFile('testing.json')

const wso2Request = require('../index').request
const expect = require('chai').expect

describe('wso2request', function () {
  it('cesapi with invalid url', async function () {
    let requestObject = {
      url: 'https://api.byu.eduacademicProgramYAPI/v1.0/32977/requirements',
      method: 'GET',
      json: true,
      resolveWithFullResponse: false,
      simple: true,
      encoding: 'utf8',
      headers: {
        Accept: 'application/json'
      }
    }

    try {
      await wso2Request(requestObject)
      expect(true).to.equal(false)
    } catch (e) {
      expect(e.error.code).to.equal('ENOTFOUND')
    }
  }).timeout(9000)
})
