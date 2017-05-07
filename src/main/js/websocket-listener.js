'use strict';

var SockJS = require('sockjs-client'); // <1>You pull in the SockJS JavaScript library for talking over WebSockets.
require('stompjs'); // <2>You pull in the stomp-websocket JavaScript library to use the STOMP sub-protocol.

function register(registrations) {
	var socket = SockJS('/sailplanes'); // <3>Here is where the WebSocket is pointed at the application’s /payroll -> /sailplanes endpoint.
	var stompClient = Stomp.over(socket);
	stompClient.connect({}, function(frame) {
		registrations.forEach(function (registration) { // <4>Iterate over the array of registrations supplied so each can subscribe for callback as messages arrive.
			stompClient.subscribe(registration.route, registration.callback);
		});
	});
}

module.exports.register = register;

