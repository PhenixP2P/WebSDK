/**
 * Copyright 2020 Phenix Real Time Solutions, Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
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
 */

define([
    'phenix-web-lodash-light'
], function(_) {
    'use strict';

    var environment = {};

    environment.parseEnvFromPcastBaseUri = function(uri) {
        uri = uri.toLowerCase();

        if (_.includes(uri, 'local')) {
            return 'local';
        } else if (_.includes(uri, 'stg')) {
            return 'staging';
        }

        return 'production';
    };

    environment.getTelemetryServerUri = function(baseUri) {
        if (!baseUri) {
            return '';
        }

        try {
            var baseURL = new URL(baseUri);
            var segments = baseURL.hostname.split('.');

            if (_.includes(segments[0], 'local')) {
                return baseUri;
            }

            if (segments.length === 2 ||
                (segments.length === 3 && segments[segments.length - 2].length <= 2 && segments[segments.length - 1].length <= 3)
            ) {
                segments.unshift('telemetry');
            } else if (_.includes(segments[0], '-stg') || segments[0] === 'stg') {
                segments[0] = 'telemetry-stg';
            } else {
                segments[0] = 'telemetry';
            }

            baseURL.hostname = segments.join('.');

            return baseURL.origin;
        } catch (e) {
            return baseUri;
        }
    };

    return environment;
});