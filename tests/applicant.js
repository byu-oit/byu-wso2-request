/**
 * Created by martin on 4/24/17.
 */

"use strict";

const setEnv        = require('../lib/setEnv')
setEnv.setEnvFromFile('testing.json')

const wso2Request = require('../index').request;
const expect = require('chai').expect;
const Promise = require('bluebird');

const co = Promise.coroutine;

describe('wso2request', function ()
{
    it('cesapi with invalid url', co(function *()
    {
        let requestObject =
            {
                url: 'https://api.byu.edu/cesapi/applicants/dev/471121066',
                method: 'GET',
                json: true,
                resolveWithFullResponse: true,
                simple: true,
                encoding: 'utf8',
                headers: {
                    Accept: 'application/json'
                }
            }

            try
            {
                const response = yield wso2Request(requestObject);
                expect(response.body).to.be.an('object');
                expect(response.statusCode).to.equal(200);
                expect(response.body).to.have.all.keys("basic")
                expect(response.body.basic).to.have.all.keys("metadata");
                expect(response.body.basic.metadata).to.have.all.keys("validation_response");
                expect(response.body.basic.metadata.validation_response).to.have.all.keys("code", "message");
                expect(response.body.basic.metadata.validation_response.code).to.equal(403);
            }
            catch (e)
            {
                expect(e.error.code).to.equal('ENOTFOUND');
            }
        
    })).timeout(9000)
});