const Discord = require('discord.io');
const fs = require('fs');

var bot = new Discord.Client({
	token: '',
});

bot
	.on('message', (user, userID, channelID, msg) => {
		if (bot.users[userID].bot) return;
		if (bot.channels[channelID].type !== 'text') return;
		if (!msg.startsWith('$')) return;
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
			default:

		}
	});

bot.connect();
