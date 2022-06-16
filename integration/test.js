/* global describe before it */
/* eslint-disable no-unused-expressions */
const expect = require('chai').expect
const wso2 = require('../index')

// Do not run these tests in the release pipeline
describe('Integration Tests', () => {
  const provider = new URL(process.env.HOST)
  const clientKey = process.env.CLIENT_KEY
  const clientSecret = process.env.CLIENT_SECRET

  const resolveWithFullResponse = true // will return request metadata
  const simple = false // will not throw responses with status codes >399

  before(async () => {
    await wso2.setOauthSettings(clientKey, clientSecret, { ...provider && { host: provider.host } })
  })

  it('should get a successful response from echo', async () => {
    const url = new URL('/echo/v1/echo/test', provider.toString())
    const response = await wso2.request({ url: url.toString(), simple, resolveWithFullResponse })
    expect(response.statusCode).equals(200)
  })
})
