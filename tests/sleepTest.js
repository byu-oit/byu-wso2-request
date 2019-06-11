'use strict'
/* global describe it */

const setEnv = require('../lib/setEnv')
setEnv.setEnvFromFile('testing.json')

// const wso2Request = require('../index').request
// const expect = require('chai').expect

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('sleepTest', function () {
  it('can get api', async function () {
    console.log(new Date().getTime())
    await sleep(1000)
    console.log(new Date().getTime())
  })
})
