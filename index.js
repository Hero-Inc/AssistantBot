const Discord = require('discord.io');
// const fs = require('fs');
const Assistant = require('google-assistant');
const config = require('./config.js');

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
	.on('message', (user, userID, channelID, msg) => {
		if (bot.users[userID].bot) return;
		if (bot.channels[channelID].type !== 'text') return;
		if (!msg.startsWith('$')) return;
		/*
		let command = msg.split(' ')[0]
			.toLowerCase()
			.substring(1);

		switch (command) {
			case 'join': {
				let voiceID = bot.servers[bot.channels[channelID].guild_id].members[userID].voice_channel_id;
				if (voiceID === undefined) {
					return bot.sendMessage({
						to: channelID,
						message: 'You must be in a voice channel to use this command',
					});
				}
				bot.joinVoiceChannel(voiceID, err => {
					if (err) {
						console.log(err);
						return bot.sendMessage({
							to: channelID,
							message: err,
						});
					}
					bot.getAudioContext({
						channelID: voiceID,
						maxStreamSize: 50 * 1024,
					}, (e, stream) => {
						if (e) {
							console.log(e);
							return bot.sendMessage({
								to: channelID,
								message: e,
							});
						}
						stream.pipe(fs.createWriteStream('./everyone.wav'));
					});
				});
				break;
			}
			case 'leave': {
				let voiceChannelID = bot.servers[bot.channels[channelID].guild_id].members[userID].voice_channel_id;
				if (voiceChannelID === undefined) {
					return bot.sendMessage({
						to: channelID,
						message: 'You must be in a voice channel to use this command',
					});
				}
				break;
			}
			default:
				return;
		}
		*/
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
				});
			}
		}
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
