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
    'sdk/express/RoomExpress',
    '../../../../test/mock/HttpStubber',
    '../../../../test/mock/WebSocketStubber',
    '../../../../test/mock/ChromeRuntimeStubber',
    '../../../../test/mock/PeerConnectionStubber',
    'sdk/room/Stream',
    'sdk/room/room.json',
    'sdk/room/member.json',
    'sdk/room/stream.json',
    'sdk/room/track.json'
], function(_, RoomExpress, HttpStubber, WebSocketStubber, ChromeRuntimeStubber, PeerConnectionStubber, Stream, room, member, stream, track) {
    describe('When Joining a Channel With Most Recent Stream Selection Strategy', function() {
        var mockBackendUri = 'https://mockUri';
        var mockAuthData = {
            name: 'mockUser',
            password: 'somePassword'
        };
        var pcastPrefix = Stream.getPCastPrefix();
        var httpStubber;
        var websocketStubber;
        var chromeRuntimeStubber = new ChromeRuntimeStubber();
        var peerConnectionStubber = new PeerConnectionStubber();
        var roomExpress;
        var streamModel = {
            uri: pcastPrefix + 'streamId',
            type: stream.types.presentation.name,
            audioState: track.states.trackEnabled.name,
            videoState: track.states.trackEnabled.name
        };
        var memberModel = {
            sessionId: 'ChannelMemberId',
            screenName: 'ChannelMember',
            role: member.roles.presenter.name,
            state: member.states.active.name,
            streams: [],
            lastUpdate: _.now()
        };
        var joinRoomResponse = {
            status: 'ok',
            room: {
                roomId: 'ChannelId',
                alias: 'ChannelAlias',
                name: 'ChannelAlias',
                description: 'Channel',
                type: room.types.channel.name
            },
            members: []
        };

        before(function() {
            chromeRuntimeStubber.stub();
            peerConnectionStubber.stub();
        });

        beforeEach(function() {
            httpStubber = new HttpStubber();
            httpStubber.stubAuthRequest();

            websocketStubber = new WebSocketStubber();
            websocketStubber.stubAuthRequest();
            websocketStubber.stubResponse('chat.JoinRoom', joinRoomResponse);
            websocketStubber.stubSetupStream();

            roomExpress = new RoomExpress({
                backendUri: mockBackendUri,
                authenticationData: mockAuthData,
                uri: 'wss://mockURI'
            });
        });

        after(function() {
            chromeRuntimeStubber.restore();
            peerConnectionStubber.restore();
        });

        afterEach(function() {
            httpStubber.restore();
            websocketStubber.restore();
            roomExpress.dispose();
        });

        function createMember(type, suffix, time) {
            var stream = _.assign({}, streamModel, {uri: pcastPrefix + 'stream' + type + suffix});

            return _.assign({}, memberModel, {
                screenName: type + suffix,
                streams: [stream],
                lastUpdate: time
            });
        }

        function parseStreamIdFromUri(uri) {
            return uri.substring(pcastPrefix.length, uri.length);
        }

        it('upon failure iterates stops when the newest member is the member that failed', function(done) {
            var subscribeCount = 0;
            var primaryMember = createMember('primary', '1', _.now());
            var alternateMember = createMember('alternate', '1', _.now() + 2);
            var normalMember = createMember('', '1', _.now());

            joinRoomResponse.members = [normalMember, primaryMember, alternateMember];

            httpStubber.stubStreamRequest(function(request, body) {
                switch (subscribeCount) {
                case 1:
                    return expect(body.originStreamId).to.be.equal(parseStreamIdFromUri(alternateMember.streams[0].uri));
                default:
                    return;
                }
            });

            roomExpress.joinChannel({
                capabilities: [],
                alias: 'ChannelAlias',
                streamSelectionStrategy: 'most-recent'
            }, function() {}, function() {
                subscribeCount++;

                if (subscribeCount >= 1 && subscribeCount < 2) {
                    return websocketStubber.stubEvent('pcast.StreamEnded', {
                        streamId: 'mockStreamId',
                        reason: 'ended',
                        sessionId: 'mockSessionId'
                    });
                }

                if (subscribeCount >= 2) {
                    done();
                }
            });

            websocketStubber.triggerConnected();
        });
    });
});