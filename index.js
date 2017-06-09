const Discord = require('discord.io');
// const fs = require('fs');
const Assistant = require('google-assistant');
const Snowboy = require('snowboy');
const config = require('./config.js');

var models = new Snowboy.Models();
models.add({
	file: './resources/snowboy.umdl',
	sensitivity: 0.5,
	hotword: 'Snowboy',
});

var detector = new Snowboy.Detector({
	resource: './resources/common.res',
	models: models,
	audioGain: 2.0,
});

var bot = new Discord.Client({
	token: config.token,
});

var assistant = new Assistant({
	auth: {
		keyFilePath: '',
		savedTokensPath: '',
	},
	audio: {
		encodingIn: 'LINEAR16',
		sampleRateOut: 24000,
	},
});

var currentChannel = '';

bot
	.on('error', err => {
		console.error(err);
	})
	.on('message', (user, userID, channelID, msg) => {
		if (bot.users[userID].bot) return;
		if (bot.channels[channelID].type !== 'text') return;
		if (!msg.startsWith('$')) return;
	})
	.on('ready', () => {
		// Start searching for our owner
		for (var channelID in bot.channels) {
			if (bot.channels.hasOwnProperty(channelID)) {
				if (bot.channels[channelID].type === 'voice' && bot.channels[channelID].members[config.owner] !== undefined) {
					// Found them
					bot.joinVoiceChannel(channelID, err => {
						if (err) {
							console.log(err);
							return bot.sendMessage({
								to: config.owner,
								message: err,
							});
						}
						currentChannel = channelID;
						bot.getAudioContext({ channelID: currentChannel, maxStreamSize: 50 * 1024 }, (e, stream) => {
							if (e) {
								console.log(e);
								bot.sendMessage({
									to: config.owner,
									message: e,
								});
								bot.leaveVoiceChannel(currentChannel, () => {
									currentChannel = '';
								});
								return;
							}
							stream.pipe(detector);
						});
					});
					break;
				}
			}
		}
		if (currentChannel === '') {
			bot.sendMessage({
				to: config.owner,
				message: 'Could not find or join owner',
			});
		}
	})
	.on('any', message => {
		if (message.t === 'VOICE_STATE_UPDATE') {
			// Someone moved channel (or was (un)muted/(un)defeaned)
			if (message.d.user_id === config.owner) {
				// It was the owner, follow them
				if (message.d.channel_id === undefined && currentChannel !== '') {
					bot.leaveVoiceChannel(currentChannel, () => {
						currentChannel = '';
					});
				} else if (message.d.channel_id === currentChannel) {
					// Still in the same channel, ignore for now
				} else {
					bot.joinVoiceChannel(message.d.channel_id, err => {
						if (err) {
							console.log(err);
							return bot.sendMessage({
								to: config.owner,
								message: err,
							});
							// TODO: Check if we leave our channel when attempting to join another channel and failing
						}
						currentChannel = message.d.channel_id;
						bot.getAudioContext({ channelID: currentChannel, maxStreamSize: 50 * 1024 }, (e, stream) => {
							if (e) {
								console.log(e);
								bot.sendMessage({
									to: config.owner,
									message: e,
								});
								bot.leaveVoiceChannel(currentChannel, () => {
									currentChannel = '';
								});
								return;
							}
							stream.pipe(detector);
						});
					});
				}
			} else if (message.d.user_id === bot.id) {
				// D: I was moved, join back for now
				bot.joinVoiceChannel(currentChannel, err => {
					if (err) {
						console.log(err);
						currentChannel = message.d.user_id;
						return bot.sendMessage({
							to: config.owner,
							message: err,
						});
						// TODO: Check if we leave our channel when attempting to join another channel and failing
					}
					bot.getAudioContext({ channelID: currentChannel, maxStreamSize: 50 * 1024 }, (e, stream) => {
						if (e) {
							console.log(e);
							bot.sendMessage({
								to: config.owner,
								message: e,
							});
							bot.leaveVoiceChannel(currentChannel, () => {
								currentChannel = '';
							});
							return;
						}
						stream.pipe(detector);
					});
				});
			}
		}
	});

detector
	.on('error', () => {
		console.error('Snowboy Detector Error');
	})
	.on('hotword', (index, hotword, buffer) => {
		// assistant.start();
		bot.sendMessage({
			to: config.owner,
			message: 'Hotword Detected',
		});
	});

assistant
	.on('ready', () => {
		bot.connect();
	})
	.on('started', (conversation) => {
		//
	})
	.on('error', err => {
		console.error(err);
	});
