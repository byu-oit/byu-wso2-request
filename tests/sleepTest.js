'use strict'
/* global describe it */

const setEnv = require('../lib/setEnv')
setEnv.setEnvFromFile('testing.json')

// const wso2Request = require('../index').request
// const expect = require('chai').expect
const Promise = require('bluebird')

const co = Promise.coroutine

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('wso2request', function () {
  it('can get api', co(function * () {
    console.log(new Date().getTime())
    yield sleep(1000)
    console.log(new Date().getTime())
  }))
})
