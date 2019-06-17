# ![BYU logo](https://www.hscripts.com/freeimages/logos/university-logos/byu/byu-logo-clipart-128.gif) byu-wso2-request
Utility for making a server to server request using wso2 authentication

**Requires Node 8**

#### Installation
```npm i --save byu-wso2-request```

#### Migration from v1 to v2
* Update to Node 8 or above (Node 6 support has been dropped)
* Use promise paradigm instead of callback paradigm for `request` (callback paradigm support has been dropped)
* Pass in `clientKey` and `clientSecret` as two parameters to `setOauthSettings` instead of as part of an object (`wellKnownUrl` is now baked into the `byu-wabs-oauth` dependency)

Otherwise, v2 functionality should be identical to v1
