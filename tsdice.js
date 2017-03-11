'use strict';
var Client = require('node-teamspeak');

/**
  * @type {{server: string, username: string, password: string, parent: string}}
 */
var config = require('./config.json').teamspeak;
var cl = new Client(config.server);
var uid = config.username;
var clid;
var cid = 1;
var pid;
var clientMessageStatus = {};
var storyteller;
var moves = [];
var initiativeHandler;
var dice = require('./dice');

var exaltedDice = dice.exaltedDice;

var wodDice = dice.wodDice;

var baseDice = dice.baseDice;

var pokeDice = dice.pokeDice;

var shadowrunDice = dice.shadowrunDice;

var l5rDice = dice.l5rDice;

var keepAlive = function () {
	cl.send('channellist', function(){
				setTimeout(keepAlive, 120000);
			});
};

var welcome = function (params) {
	var target = params.clid;
	var msg = 'Welcome! I am the Dice Bot!';
	if (clientMessageStatus[target] === undefined) {
		clientMessageStatus[target] = 0;
	}
	if (clientMessageStatus[target] % 2 === 1) {
		msg = 'You can send me any dice commands in this window, and I will roll them in secret and send the results to you and the Storyteller';
	}
	clientMessageStatus[target] += 1;
	cl.send('sendtextmessage', {
		targetmode: 1, target: target, msg: msg
	}, function (err, response) {});
};

var skMoves = function (params) {
	var raw = params.msg.substr(4);
	var out = '';
	var name = '';
	if (raw.toLowerCase() === 'flush') {
		out = moves.join(' | ');
		moves = [];
		cl.send('clientupdate', {clid: clid, client_nickname: 'Moves'}, function () {
			cl.send('sendtextmessage', {
				targetmode: 2, msg: out
			}, function () {
				cl.send('clientupdate', {clid: clid, client_nickname: 'Dice Roller'}, function () {});
			});
		});
	} else if (raw.toLowerCase() === 'reset') {
		moves = [];
	} else {
		if (params.invokername.toLowerCase() !== 'storyteller') {
			name = params.invokername;
			cl.send('clientupdate', {clid: clid, client_nickname: 'Moves'}, function () {
				cl.send('sendtextmessage', {
					targetmode: 2, msg: name + ' has recorded a maneuver'
				}, function () {
					cl.send('clientupdate', {clid: clid, client_nickname: 'Dice Roller'}, function () {});
				});
			});
		} else {
			raw = raw.split(' ');
			name = raw.shift();
			raw = raw.join(' ');
		}
		moves.push('[b]' + name + ':[/b] ' + raw);
	}
};

var diceResults = function (remainder, params, result, diceCode, msg, firstPart, target) {
	msg = remainder + '\n' + params.invokername +
				' rolling ' + diceCode + '\n' + result;
			cl.send('clientupdate', {clid: clid, client_nickname: firstPart}, function () {
				cl.send('sendtextmessage', {
					targetmode: params.targetmode, target: target, msg: msg
				}, function () {
					if (params.targetmode === 1 && target !== storyteller && storyteller !== undefined) {
						cl.send('sendtextmessage', {
							targetmode: 1, target: storyteller, msg: msg
						}, function () {
							cl.send('clientupdate', {clid: clid, client_nickname: 'Dice Roller'}, function () {});
						});
					} else {
						cl.send('clientupdate', {clid: clid, client_nickname: 'Dice Roller'}, function () {
						});
					}
				});
			});
}

/**
 * @param {{target: string, invokerid: number, msg: string, invokername: string, targetmode: number}} params
 */
var diceHandler = function (params) {
	var msgParts = params.msg.toString().match(/\(([0-9].+?)\)/);
	var result;
	var firstPart;
	var remainder = '';
	var labelStart = 0;
	var diceCode = '';
	var target = params.target ? params.invokerid : cid;
	var msg = '';
	if (msgParts && params.invokerid !== clid) {
		labelStart = params.msg.indexOf(' ') + 1;
		if (params.msg.length > 30 && labelStart > 0) {
			firstPart = params.msg.substring(labelStart, 30 + labelStart);
			remainder = params.msg.substring(30 + labelStart);
			diceCode = params.msg.substring(0, labelStart);
		} else {
			if (labelStart > 0) {
				firstPart = params.msg.substring(labelStart);
				diceCode = params.msg.substring(0, labelStart);
			} else {
				firstPart = 'Dice Roller';
				diceCode = params.msg;
			}
		}
		if (msgParts[1].match(/^[0-9]+?e/)) {
			exaltedDice(msgParts[1], function(mesg) {
					diceResults(remainder, params, mesg, diceCode, msg, firstPart, target);
				});
		} else if (msgParts[1].match(/^[0-9]+?w/)) {
			result = wodDice(msgParts[1]);
		} else if (msgParts[1].match(/^[0-9]+?d/)) {
			result = baseDice(msgParts[1]);
		} else if (msgParts[1].match(/^[0-9]+?s/)) {
			result = shadowrunDice(msgParts[1]);
		} else if (msgParts[1].match(/^[0-9]+?k/)) {
			result = l5rDice(msgParts[1], params.invokername, firstPart + remainder);
		} else if (msgParts[1].match(/^[0-9]+?p/)) {
			result = pokeDice(msgParts[1]);
		}
		if (result) {
			diceResults(remainder, params, result, diceCode, msg, firstPart, target);
		}
	}
};

cl.send('login', {client_login_name: uid, client_login_password: config.password},
	/**
	 * @param err
	 * @param {{client_id: number}}response
	 */
	function(err, response){
	console.log(err,response);
	cl.send('use', {sid: 1}, function(){
		cl.send('whoami', function (err, response) {
			clid = response.client_id;
			initiativeHandler = require('./initiative')(cl, clid)
			cl.send('clientupdate', {clid: clid, client_nickname: 'Dice Roller'}, function () {
				cl.send('servernotifyregister', {event: 'textchannel', id:0}, function(){
					cl.on('textmessage', function (params) {
						if (params.msg) {
							if (params.msg.toString().match(/^!/)) {
								if (params.msg.toString().match(/^!sk/)) {
									skMoves(params);
								} else {
									initiativeHandler(params);
								}
							}
							else {
								diceHandler(params);
							}
						}
					});
					keepAlive();
				});
				cl.send('servernotifyregister', {event: 'channel', id:0}, function(){
					cl.on('channelcreated',
						/**
						 * @param {{cpid: number, cid: number}} params
						 */
						function (params) {
						if (params.cpid === pid && cid === 1) {
							cl.send('clientmove', {clid: clid, cid: params.cid}, function () {
								cid = params.cid;
							});
						}
					});
				});
				cl.send('servernotifyregister', {event: 'textprivate', id:0}, function (err, response) {});
				cl.on('clientmoved',
					/**
					 * @param {{ctid: number}}params
					 */
					function (params) {
					if (params.ctid === cid) {
						welcome(params);
					}
				});
				cl.send('channellist', function(err, response){
					response.forEach(
						/**
						 * @param {{channel_name: string, cid: number}}channel
						 */
						function(channel){
						if (channel.channel_name === config.parent) {
							pid = channel.cid;
						}
						if (config.channels.indexOf(channel.channel_name.toLowerCase()) > -1) {
							cl.send('clientmove', {clid: clid, cid: channel.cid}, function () {
								cid = channel.cid;
								cl.send('clientlist', {cid:cid}, function (err, response) {
									if (response) {
										if (response.forEach) {
											response.forEach(function (client) {
												welcome({clid: client.clid});
												welcome({clid: client.clid});
												if (client.client_nickname.toLowerCase() === 'storyteller') {
													storyteller = client.clid;
												}
											});
										} else {
											welcome({clid: response.clid});
											welcome({clid: response.clid});
											if (response.client_nickname.toLowerCase() === 'storyteller') {
												storyteller = response.clid;
											}
										}
									}
								});
							});
						}
					});
				});
			});
		});
	});
});