"use strict";
const byuOauth      = require('byu-wabs-oauth');
const expect        = require('chai').expect;
const Promise       = require('bluebird');

const co = Promise.coroutine;

const clientId = getArgv('client-id');
const clientSecret = getArgv('client-secret');
const wellKnownUrl = getArgv('well-known-url');

// validate that all required command line args were issued
if (!clientId || !clientSecret || !wellKnownUrl) {
  console.error('Missing values for one or more of the following command line arguments: --client-id, --client-secret, --well-known-url');
  process.exit(1);
}

describe('byu-wabs-oauth', function() {

  describe('client grant', function() {

    it('can get access token', co(function *() {
      const oauth = byuOauth(clientId, clientSecret, wellKnownUrl);
      const token = yield oauth.getClientGrantAccessToken();
      expect(token).to.be.an('object');
      expect(token.accessToken).to.be.a('string');
      expect(token.accessToken.length).to.be.greaterThan(0);
    }));

    it('can revoke access token', co(function *() {
      const oauth = byuOauth(clientId, clientSecret, wellKnownUrl);
      const firstToken = yield oauth.getClientGrantAccessToken();
      yield oauth.revokeTokens(firstToken.accessToken);
      const secondToken = yield oauth.getClientGrantAccessToken();
      expect(firstToken.accessToken).to.not.equal(secondToken.accessToken);
    }));

  });

});

/**
 * Find the value for an argument with the specified name.
 * @param {string} name
 * @returns {string|boolean}
 */
function getArgv(name) {
  let i;
  let data;
  for (i = 0; i < process.argv.length; i++) {
    if (process.argv[i].indexOf('--' + name) === 0) {
      data = process.argv[i].substr(2).split('=');
      return data[1] || true;
    }
  }
}

const getTokenFromCode = co(function *(oauth) {
  const oauthUrl = yield oauth.getCodeGrantAuthorizeUrl(redirectUri, 'openid', 'no-state');
  const uriPort = analyzeUrl(redirectUri).port;
  const oauthCode = yield auth.getOauthCode(oauthUrl, netId, password, uriPort);
  return oauth.getCodeGrantAccessToken(oauthCode, redirectUri);
});