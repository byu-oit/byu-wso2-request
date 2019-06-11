"use strict";

const setEnv = require('../lib/setEnv')
setEnv.setEnvFromFile('testing.json')

const clientKey = process.env.WSO2_CLIENT_KEY || 'client-id';
const clientSecret = process.env.WSO2_CLIENT_SECRET || 'client-secret';
const wellKnownUrl = process.env.WSO2_WELLKNOWN_URL || 'well-known-url'

const wso2Request = require('../index');
const byuOauth = require('byu-wabs-oauth');
const expect = require('chai').expect;
const Promise = require('bluebird');
const request = require('request-promise')

const co = Promise.coroutine;

describe('wso2requestRetry', async function ()
{
    const oauth = await byuOauth(clientKey, clientSecret)

    it('detect unauthorized', co(function *()
    {
        let     attempts = 0;
        const   maxAttemps = 2;
        let     response = {};
        let wso2OauthToken = null;

        let requestObject =
        {
            url: 'https://api.byu.edu/curriculum/v1.0/academicProgram/32977',
            method: 'GET',
            json: true,
            resolveWithFullResponse: true,
            simple: true,
            encoding: 'utf8',
            headers: {
                Accept: 'application/json'
            }
        }

        while (attempts < maxAttemps)
        {
            attempts += 1;
            if (!wso2OauthToken)
            {
                wso2OauthToken = yield oauth.getClientGrantToken();
            }
            if (!requestObject.hasOwnProperty('headers'))
            {
                requestObject.headers = {};
            }
            requestObject.headers.Authorization = wso2Request.oauthHttpHeaderValue(wso2OauthToken);

            yield oauth.revokeToken(wso2OauthToken.accessToken);

            console.log('Making attempt', attempts);
            try
            {
                response = yield request(requestObject);
            }
            catch (e)
            {
                console.log(e);
                response = e.response;
            }
            console.log('response.statusCode:', response.statusCode);
            expect(response.statusCode).to.equal(401);

            if (response.statusCode === 401)
            {
                console.log('Detected unauthorized request.  Revoking token');
                wso2OauthToken = null;
            }
            else
            {
                break;
            }
        }
        expect(attempts).to.equal(2);

    }));


    it('invalid url', co(function *()
    {
        let     attempts = 0;
        const   maxAttemps = 2;
        let     response = {};
        let wso2OauthToken = null;

        let requestObject =
            {
                url: 'https://api.byu.edu/curriculum/v1.0/academicPrograX/32977',
                method: 'GET',
                json: true,
                resolveWithFullResponse: true,
                simple: true,
                encoding: 'utf8',
                headers: {
                    Accept: 'application/json'
                }
            }

        while (attempts < maxAttemps)
        {
            attempts += 1;
            if (!wso2OauthToken)
            {
                wso2OauthToken = yield oauth.getClientGrantToken();
            }
            if (!requestObject.hasOwnProperty('headers'))
            {
                requestObject.headers = {};
            }
            requestObject.headers.Authorization = wso2Request.oauthHttpHeaderValue(wso2OauthToken);

            yield oauth.revokeToken(wso2OauthToken.accessToken);

            console.log('Making attempt', attempts);
            try
            {
                response = yield request(requestObject);
            }
            catch (e)
            {
                console.log(e);
                response = e.response;
            }
            console.log('response.statusCode:', response.statusCode);
            expect(response.statusCode).to.equal(401);

            if (response.statusCode === 401)
            {
                console.log('Detected unauthorized request.  Revoking token');
                wso2OauthToken = null;
            }
            else
            {
                break;
            }
        }
        expect(attempts).to.equal(2);

    }));
});