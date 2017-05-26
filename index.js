const Discord = require('eris');
const GoogleAssistant = require('google-assistant');
const Snowboy = require('snowboy');
const ffmpeg = require('fluent-ffmpeg');
const stream = require('stream');

var models = new Snowboy.Models();
models.add({
	file: 'okgoogle.pmdl',
	sensitivity: 0.5,
	hotwords: 'OK Google',
});

var bot = new Discord.CommandClient('TOKEN', {
	description: 'Your personal assistant, running on Discord Eris and Google Assistant.',
	defaultCommandOptions: {
		caseInsensitive: true,
		deleteCommand: true,
		guildOnly: true,
	},
});

bot
	.on('error', e => {
		console.log(e);
	});

bot.registerCommand(
	'join',
	(msg, args) => {
		if (msg.member.voiceState.channelID !== undefined) {
			bot.joinVoiceChannel(msg.member.voiceState.channelID)
				.then(conn => {
					let receive = conn.receive('opus');
					let detector = new Snowboy.Detector();
					let assistant = new GoogleAssistant({
						auth: {
							keyFilePath: '',
							savedTokensPath: '',
						},
						audio: {
							encodingIn: 'FLAC',
							sampleRateOut: 24000,
						},
					});
					let assisting = false;
					let ready = false;
					let pass = new stream.PassThrough();
					let speaking = false;
					assistant
						.on('audio-data', data => {
							pass.write(data);
							if (!speaking) {
								conn.play(pass);
								speaking = true;
							}
						})
						.on('ready', () => {
							ready = true;
						})
						.on('started', conversation => {
							assisting = true;
							conversation
								.on('end-of-utterance', () => {
									receive.end();
								})
								.on('transcription', text => {
									console.log(`Transcript: ${text}`);
								})
								.on('ended', (err, continueConversation) => {
									if (err) {
										console.log(err);
									} else if (continueConversation) {
										receive = conn.receive('opus');
										assistant.start();
									} else {
										assisting = false;
										receive = conn.receive('opus');
										receive.pipe(detector);
									}
								})
								.on('error', e => {
									console.log(e);
								});
							// Send user data to the conversation
							ffmpeg(receive)
								.audioCodec('flac')
								.audioBitrate(24000)
								.audioChannels(1)
								.pipe(conversation);
						});
					detector
						.on('hotword', (index, hotword, buffer) => {
							if (!assisting && ready) {
								assistant.start();
							}
							console.log('hotword', index, hotword);
						});
					receive.pipe(detector);
				});
		}
		bot.createMessage(msg.channel.id, 'Hello');
	},
	{
		aliases: ['voice', 'come'],
		description: 'Join the voice channel',
		fullDescription: 'Make the bot join the voice channel the user is currently connected to, if any.',
	}
);
