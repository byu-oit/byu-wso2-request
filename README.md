# ![BYU logo](https://www.hscripts.com/freeimages/logos/university-logos/byu/byu-logo-clipart-128.gif) byu-wso2-request
Utility for making a server to server request using wso2 authentication

[![codecov](https://codecov.io/gh/byu-oit/byu-wso2-request/branch/main/graph/badge.svg?token=nzJwvKNRGk)](https://codecov.io/gh/byu-oit/byu-wso2-request)

> [!WARNING]
> **Deprecated**
>
> This package is no longer maintained and has been deprecated.
>
> Please use **client-byu** instead:
>
> https://github.com/byu-oit-sdk/javascript/tree/main/packages/client-byu
>
> Existing projects are encouraged to migrate.

#### Migration to `@byu-oit-sdk/client-byu`

`@byu-oit-sdk/client-byu` is the supported replacement for this package in the
[BYU OIT SDK JavaScript repo](https://github.com/byu-oit-sdk/javascript/tree/main/packages/client-byu).

1. Replace the dependency:

```sh
npm uninstall byu-wso2-request
npm install @byu-oit-sdk/client-byu
```

2. Rename configuration:

| `byu-wso2-request` | `@byu-oit-sdk/client-byu` |
| --- | --- |
| `WSO2_CLIENT_KEY` | `BYU_OIT_CLIENT_ID` |
| `WSO2_CLIENT_SECRET` | `BYU_OIT_CLIENT_SECRET` |
| `WSO2_HOST` or `BYUAPI_DOMAIN` | `ENVIRONMENT_NAME=prd`, `sandbox`, or `dev` |

3. Replace `setOauthSettings` with a reusable client instance:

```js
// Before
const wso2 = require('byu-wso2-request')
await wso2.setOauthSettings('myClientKey', 'myClientSecret', { host: 'api.byu.edu' })
const response = await wso2.request({ url: 'https://api.byu.edu/echo/v1/echo/test' })

// After
import { Client } from '@byu-oit-sdk/client-byu'

const client = new Client()
const response = await client.request({ url: '/echo/v1/echo/test' })
```

4. Keep request options on the same object. For example, `method`, `headers`, `body`, `qs`,
`simple`, and `resolveWithFullResponse` are still passed to `client.request`.
If existing code depends on throwing for non-2xx responses, set `simple: true`.
If existing code needs a request-style object with `statusCode`, `headers`, and `body`,
set `resolveWithFullResponse: false`; otherwise the new client returns a fetch `Response`.

5. Move helper behavior into request options. For example, replace `actingForHeader(request, netId)`
with `headers: { 'acting-for': netId }`, and replace the old second `request` argument for an
original JWT with `headers: { 'x-jwt-assertion-original': originalJwt }`.

### Original Documentation

**Requires Node 10+**

#### Installation
```npm i --save byu-wso2-request```

#### Migration from v1 to v2.1+
* Update to Node 8 or above
* Use promises instead of callbacks for `request`

#### Migration from v2 to v3
* Update to Node 10 or above
* If you want the `statusCode` property added to responses, make the requests with the `resolveWithFullResponse` option set to `true` (See: [#30](https://github.com/byu-oit/byu-wso2-request/pull/30))

#### Usage

Set up with `setOauthSettings` and then make requests with `request`

Examples:
```js
const wso2 = require('byu-wso2-request')

(async () => {
  // Will default to api.byu.edu if host is not passed in
  const production = process.env.ENVIRONMENT_NAME === 'prd'
  const host = production ? 'api.byu.edu' : 'api-sandbox.byu.edu'
  
  // Alternatively, you can set the host in the environment variables
  // process.env.WSO2_HOST = 'api.byu.edu'

  // Do this once on startup
  await wso2.setOauthSettings('myClientKey', 'myClientSecret', { host })
  
  // After that, make all the requests you want
  try {
    // Simple GET request
    const response1 = await wso2.request({ url: `https://${host}/echo/v1/echo/test` })

    // Request using another method
    const response2 = await wso2.request({ method: 'PUT', url: `https://${host}/byuapi/students/v2/123456789/enrolled_classes/Summer2019,BIO,100,001`, body: { credit_hours: 3 } })
    
    // Request that passes along an original JWT
    const response3 = await wso2.request({ url: `https://${host}/echo/v1/echo/test` }, 'some original jwt to pass along')
    
    // Request where you want to know what status code came back (instead of just rejecting if it's not 2XX)
    const response4 = await wso2.request({ url: `https://${host}/echo/v1/echo/test`, simple: false, resolveWithFullResponse: true })
  } catch (e) {
    console.error(e) // Handle errors
  }
})
```

For more information on the options you can use for the `request` function, see [request-promise](https://www.npmjs.com/package/request-promise)
