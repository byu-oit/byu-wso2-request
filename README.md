# ![BYU logo](https://www.hscripts.com/freeimages/logos/university-logos/byu/byu-logo-clipart-128.gif) byu-wso2-request
Utility for making a server to server request using wso2 authentication

[![codecov](https://codecov.io/gh/byu-oit/byu-wso2-request/branch/main/graph/badge.svg?token=nzJwvKNRGk)](https://codecov.io/gh/byu-oit/byu-wso2-request)

**Requires Node 12+**

#### Installation
```npm i --save byu-wso2-request```

#### Migration from v1 to v2.1+
* Update to Node 8 or above
* Use promises instead of callbacks for `request`

#### Migration from v2 to v3
* Update to Node 10 or above
* If you want the `statusCode` property added to responses, make the requests with the `resolveWithFullResponse` option set to `true` (See: [#30](https://github.com/byu-oit/byu-wso2-request/pull/30))

#### Migration from v3 to v4
* Update to Node 12 or above

#### Usage

Set up with `setOauthSettings` and then make requests with `request`

Examples:
```js
const wso2 = require('byu-wso2-request')

(async () => {
  // Do this once on startup
  await wso2.setOauthSettings('myClientKey', 'myClientSecret')
  
  // After that, make all the requests you want
  try {
    // Simple GET request
    const response1 = await wso2.request({ url: 'https://api.byu.edu/echo/v1/echo/test' })

    // Request using another method
    const response2 = await wso2.request({ method: 'PUT', url: 'https://api.byu.edu:443/byuapi/students/v2/123456789/enrolled_classes/Summer2019,BIO,100,001', body: { credit_hours: 3 } })
    
    // Request that passes along an original JWT
    const response3 = await wso2.request({ url: 'https://api.byu.edu/echo/v1/echo/test' }, 'some original jwt to pass along')
    
    // Request where you want to know what status code came back (instead of just rejecting if it's not 2XX)
    const response4 = await wso2.request({ url: 'https://api.byu.edu/echo/v1/echo/test', simple: false, resolveWithFullResponse: true })
  } catch (e) {
    console.error(e) // Handle errors
  }
})
```

For more information on the options you can use for the `request` function, see [request-promise](https://www.npmjs.com/package/request-promise)
