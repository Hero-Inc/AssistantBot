const Discord = require('eris');
const GoogleAssistant = require('google-assistant');
const Snowboy = require('snowboy');
const ffmpeg = require('fluent-ffmpeg');
const stream = require('stream');

var models = new Snowboy.Models();
models.add({
	file: 'resources/okgoogle.umdl',
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
							keyFilePath: 'resources/clientsecret.json',
							savedTokensPath: 'resources/tokens.js',
						},
						audio: {
							encodingIn: 'FLAC',
							encodingOut: 'OPUS_IN_OGG',
							sampleRateOut: 24000,
						},
					});
					let assisting = false;
					let ready = false;
					let pass = new stream.PassThrough();
					let speaking = false;
					assistant
						.on('ready', () => {
							ready = true;
						})
						.on('started', conversation => {
							assisting = true;
							conversation
								.on('audio-data', data => {
									pass.write(data);
									if (!speaking) {
										conn.play(pass);
										speaking = true;
									}
								})
								.on('end-of-utterance', () => {
									receive.pause();
								})
								.on('transcription', text => {
									console.log(`Transcript: ${text}`);
								})
								.on('response', text => {
									bot.createMessage(msg.channel.id, text);
								})
								.on('ended', (err, continueConversation) => {
									speaking = false;
									if (err) {
										console.log(err);
									} else if (continueConversation) {
										assistant.start();
									} else {
										assisting = false;
										receive.pipe(detector);
									}
								})
								.on('error', e => {
									console.log(e);
								});
							// Send user data to the conversation
							ffmpeg(receive)
								.audioCodec('flac')
								.audioBitrate(16000)
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
		return 'Hello';
	},
	{
		aliases: ['voice', 'come'],
		description: 'Join the voice channel',
		fullDescription: 'Make the bot join the voice channel the user is currently connected to, if any.',
	}
);
