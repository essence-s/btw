const { Connectbaileys } = require('./lbSbot/GG.js');
const {
	getDataSearch,
	parseSearchData,
	messageCustomFormat,
	parseStringValues,
	parseStringValues2,
	evalu,
	evalu2,
	dataInfoMesague,
	getVideoInfo,
	downloadG,
	joinVideoAndAudio,
	totalFileSize,
	checkTotalFileSize,
	renameVideo,
	convertMP3,
	generateRandomName,
	deleteFile,
} = require('./utils');

const { saveData, getDataUser, addSeletedVideoInfo } = require('./adp');

const YTD = {
	invo: '.yt',
	data: [
		{
			word: 'Escriba su búsqueda :V',
			execfunction: async ({ ctx, sendMessage, endFlow }) => {
				let message = ctx.messages[0].message.conversation;
				let pushName = ctx.messages[0].pushName;

				if (message.toLowerCase() == 'exit') return endFlow('exit');

				let { items } = await getDataSearch(`${message}`, 5);
				let parsedData = parseSearchData(items);

				saveData(pushName, (dataAct) => {
					return {
						...dataAct,
						pushName: pushName,
						dataSaveSearch: parsedData,
					};
				});

				let dataFormatTextSend = messageCustomFormat(parsedData);
				// await flowDynamic({ body: dataFormatTextSend })
				await sendMessage(dataFormatTextSend);
			},
		},
		{
			word: 'Elija con un numero y espere...',
			execfunction: async ({ ctx, sendMessage, fallBack, endFlow }) => {
				let message = ctx.messages[0].message.conversation;
				let pushName = ctx.messages[0].pushName;
				if (message.toLowerCase() == 'exit') return endFlow('exit');
				let optionsObject = parseStringValues(message);

				let evaluated = evalu(
					optionsObject.option,
					optionsObject.format,
					optionsObject.quality
				);
				if (evaluated == 'noDataOption') {
					// console.log('fallback')
					return fallBack();
				}

				addSeletedVideoInfo(pushName, evaluated.dataOptions.option - 1);

				saveData(pushName, (dataAct) => {
					return {
						...dataAct,
						dataOptions: { ...evaluated.dataOptions },
					};
				});

				let url = getDataUser(pushName).selectedVideoInfo.videoId;

				if (evaluated.mode == 1) {
					let datainfoQualitys = await getVideoInfo(url);

					saveData(pushName, (dataAct) => {
						return {
							...dataAct,
							dataQualitys: datainfoQualitys,
						};
					});

					let infoMessague = dataInfoMesague(datainfoQualitys.videos);

					// console.log(infoMessague)
					await sendMessage(infoMessague);
				} else if (evaluated.mode == 2) {
					await fallBack();
				}
			},
		},
		{
			word: 'Elija con un numero la calidad y con letras el formato ejemplo: \n 1 mp3 \n Si no se escoje el formato sera mp4',
			execfunction: async ({ ctx, endFlow, sendFile, fallBack }) => {
				let message = ctx.messages[0].message.conversation;
				let pushName = ctx.messages[0].pushName;
				if (message.toLowerCase() == 'exit') return endFlow('exit');
				let dataUser = getDataUser(pushName);
				let cantVideos = dataUser.dataQualitys.videos.length;
				const createArrayNum = (num) => {
					let arrayOptinosLengthVideos = [];
					for (let i = 1; i <= num; i++) {
						arrayOptinosLengthVideos.push(i);
					}
					return arrayOptinosLengthVideos;
				};
				let optionsObject = parseStringValues2(
					message,
					createArrayNum(cantVideos)
				);
				let urlVideo = dataUser.selectedVideoInfo.videoId;
				let evaluado = evalu2(
					optionsObject.format,
					optionsObject.numOptionQuality
				);
				if (evaluado.format == 'mp3') {
					let ramdomName = generateRandomName();
					let indexAudio = dataUser.dataQualitys.audios[0].index;
					let audioPath = await downloadG(urlVideo, indexAudio, ramdomName);
					let totalSize = await totalFileSize([audioPath]);
					let statusCheck = checkTotalFileSize(totalSize);
					if (statusCheck == 'passedLimit') return fallBack();
					let audioMp3 = await convertMP3(audioPath, ramdomName);
					let newName = dataUser.selectedVideoInfo.title;
					let pathNewName = await renameVideo(audioMp3, `${newName}.mp3`);
					await sendFile(pathNewName);
					deleteFile([pathNewName, audioPath]);
				} else {
					let indexVideo =
						dataUser.dataQualitys.videos[
							parseInt(evaluado.numOptionQuality) - 1
						].index;
					let indexAudio = dataUser.dataQualitys.audios[0].index;
					let ramdomNameVideo = generateRandomName();
					let ramdomNameAudio = generateRandomName();
					let [videoPath, audioPath] = await Promise.all([
						downloadG(urlVideo, indexVideo, ramdomNameVideo),
						downloadG(urlVideo, indexAudio, ramdomNameAudio),
					]);
					let totalSize = await totalFileSize([videoPath, audioPath]);
					let statusCheck = checkTotalFileSize(totalSize);
					if (statusCheck == 'passedLimit') return fallBack();
					let newName = dataUser.selectedVideoInfo.title;
					let nameRamdom = ramdomNameVideo + ramdomNameAudio;
					let videoWithAudioPath = await joinVideoAndAudio(
						videoPath,
						audioPath,
						nameRamdom
					);
					let pathNewName = await renameVideo(
						videoWithAudioPath,
						`${newName}.mp4`
					);
					try {
						await sendFile(pathNewName);
					} catch (e) {
						console.log(e);
					}
					deleteFile([pathNewName, videoPath, audioPath]);
				}
			},
		},
	],
};

const superDino = [YTD];
// connectToWhatsApp(superDino)
let cB = new Connectbaileys(superDino);
cB.initBailey();
