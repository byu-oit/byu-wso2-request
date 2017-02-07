"use strict";
const wso2request = require('../index');
const expect = require('chai').expect;
const Promise = require('bluebird');

const co = Promise.coroutine;

describe('wso2request', function ()
{
    it('can get api', co(function *()
    {
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

        return request(requestObject)
    }));
});

/**
 * Find the value for an argument with the specified name.
 * @param {string} name
 * @returns {string|boolean}
 */
function getArgv(name)
{
    let i;
    let data;
    for (i = 0; i < process.argv.length; i++)
    {
        if (process.argv[i].indexOf('--' + name) === 0)
        {
            data = process.argv[i].substr(2).split('=');
            return data[1] || true;
        }
    }
}