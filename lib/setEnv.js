/*
 * Copyright 2016 Brigham Young University
 *
 * Licensed under the Apache License, Version 2.0 (the "License")
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

'use strict'

let safelyParseConfigJSON = function (json) {
  let parsed
  try {
    parsed = JSON.parse(json)
    if (!Object.keys(parsed).length) {
      console.error('Config JSON does not contain keys.')
    }
  } catch (e) {
    console.error('Config JSON is invalid. Contents may contain secrets and are not logged.')
  }

  return parsed
}

exports.setEnvFromFile = function (fn) {
  let fs = require('fs')
  let config
  config = safelyParseConfigJSON(fs.readFileSync(__dirname + '/../.env/' + fn).toString()) // eslint-disable-line no-path-concat
  for (let p of Object.keys(config)) {
    process.env[p] = config[p]
  }
}
