/**
 * Copyright 2018 Phenix Inc. All Rights Reserved.
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
    'phenix-web-lodash-light',
    'phenix-web-assert',
    'phenix-web-http'
], function(_, assert, http) {
    'use strict';

    function AdminAPI(backendUri, authenticationData) {
        assert.isStringNotEmpty(backendUri, 'backendUri');
        assert.isObject(authenticationData, 'authenticationData');

        this._backendUri = backendUri;
        this._authenticationData = authenticationData;
    }

    AdminAPI.prototype.createAuthenticationToken = function createAuthenticationToken(callback) {
        var data = appendAuthDataTo.call(this, {});

        http.postWithRetry(this._backendUri + '/auth', JSON.stringify(data), {retryOptions: {maxAttempts: 1}}, _.bind(handleResponse, this, callback));
    };

    AdminAPI.prototype.createStreamTokenForPublishing = function createStreamTokenForPublishing(sessionId, capabilities, callback) {
        assert.isStringNotEmpty(sessionId, 'sessionId');
        assert.isObject(capabilities, 'capabilities');

        var data = appendAuthDataTo.call(this, {
            sessionId: sessionId,
            capabilities: capabilities
        });

        http.postWithRetry(this._backendUri + '/stream', JSON.stringify(data), {retryOptions: {maxAttempts: 1}}, _.bind(handleResponse, this, callback));
    };

    AdminAPI.prototype.createStreamTokenForSubscribing = function createStreamTokenForSubscribing(sessionId, capabilities, streamId, alternateStreamIds, callback) {
        assert.isStringNotEmpty(sessionId, 'sessionId');
        assert.isObject(capabilities, 'capabilities');

        if (!_.isNullOrUndefined(alternateStreamIds)) {
            assert.isArray(alternateStreamIds, 'additionalStreamIds');

            _.forEach(alternateStreamIds, function(alternateOriginStreamId) {
                assert.isStringNotEmpty(alternateOriginStreamId, 'alternateOriginStreamId');
            });
        }

        var data = appendAuthDataTo.call(this, {
            sessionId: sessionId,
            capabilities: capabilities,
            originStreamId: streamId
        });

        if (alternateStreamIds && alternateStreamIds.length > 0) {
            data.alternateOriginStreamIds = alternateStreamIds;
        }

        http.postWithRetry(this._backendUri + '/stream', JSON.stringify(data), {retryOptions: {maxAttempts: 1}}, _.bind(handleResponse, this, callback));
    };

    AdminAPI.prototype.getStreams = function getStreams(callback) {
        http.getWithRetry(this._backendUri + '/streams', {retryOptions: {maxAttempts: 1}}, _.bind(handleResponse, this, callback));
    };

    function appendAuthDataTo(data) {
        return _.assign({}, data, this._authenticationData);
    }

    function handleResponse(callback, error, response) {
        if (error) {
            return callback(error, {});
        }

        var res = JSON.parse(response.data);

        if (res.status !== 'ok') {
            return callback(null, {status: res.status});
        }

        return callback(null, res);
    }

    return AdminAPI;
});