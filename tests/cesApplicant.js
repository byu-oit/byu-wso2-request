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
    it('can get cesapi', co(function *()
    {
        let requestObject =
            {
                url: 'https://api.byu.edu/cesapi/applicants/dev/',
                method: 'GET',
                json: true,
                resolveWithFullResponse: true,
                simple: true,
                encoding: 'utf8',
                headers: {
                    Accept: 'application/json'
                }
            }

        const response = yield wso2Request(requestObject);
        expect(response.body).to.be.an('object');
        expect(response.statusCode).to.equal(200);
        expect(response.body.programId).to.equal('32977');
    }));

    it('can get cesapi with callback', co(function *()
    {
        let requestObject =
            {
                url: 'https://api.byu.edu/cesapi/applicants/dev/',
                method: 'GET',
                json: true,
                resolveWithFullResponse: true,
                simple: true,
                encoding: 'utf8',
                headers: {
                    Accept: 'application/json'
                }
            }

        wso2Request(requestObject, function (err, response)
        {
            expect(response.body).to.be.an('object');
            expect(response.statusCode).to.equal(200);
            expect(response.body.programId).to.equal('32977');
        })
    }));
});