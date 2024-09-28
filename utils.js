const { exec } = require('child_process');
const fs = require('fs');
const youtubesearchapi = require('youtube-search-api');
const ytdl = require('@distube/ytdl-core');

const getDataSearch = async (search, maxResults) => {
	const responseF = await youtubesearchapi.GetListByKeyword(
		search,
		false,
		maxResults,
		[{ type: 'video' }]
	);

	return responseF;
};

const parseSearchData = (arrayfromSearch) => {
	return arrayfromSearch.map((d) => {
		let {
			id,
			title,
			thumbnail: { thumbnails },
			length: { simpleText },
		} = d;
		return {
			videoId: `https://www.youtube.com/watch?v=${id}`,
			title,
			imgVideo: thumbnails[0].url,
			duration: simpleText,
		};
	});
};
const messageCustomFormat = (dataFormat) => {
	let dataFormatTextSend = dataFormat.reduce((suma, act, i) => {
		return `${suma == '' ? '' : suma + '\n\n'}${
			'```option'.padEnd(12) + '``` : ' + (i + 1)
		}\n${'```duration'.padEnd(12) + '``` : ' + act.duration}\n${
			'```title'.padEnd(12) + '``` : ' + act.title
		}`;
	}, '');

	return dataFormatTextSend;
};

const convertMP3 = (pathVideo, pathOutput) => {
	return new Promise((resolve) => {
		let outputFilePath = `${pathOutput}.mp3`;
		// Comando FFmpeg para convertir el archivo
		const ffmpegCommand = `ffmpeg -y -i ${pathVideo} ${outputFilePath}`;

		const ffmpegProcess = exec(ffmpegCommand);

		ffmpegProcess.on('exit', (code) => {
			if (code === 0) {
				// console.log('La conversión se completó exitosamente.');
				resolve(outputFilePath);
			} else {
				console.error('La conversión falló con el código de salida:', code);
			}
		});

		// Capturar el evento close cuando el proceso se cierra
		// ffmpegProcess.on('close', () => {
		//     console.log('El proceso FFmpeg se ha cerrado.');
		// });
	});
};

//obtener las opciones de option ,qualyti y calidad si no los consigue se usan los default
let options = ['1', '2', '3', '4', '5'];
let formats = ['mp4', 'mp3'];
let qualitys = ['highest', 'medium', 'lowest'];

const optionSentence = (array, sentenceD, dataDefault) => {
	let ff = sentenceD
		.toLowerCase()
		.split(' ')
		.filter((el) => el !== '');
	let ll = ff.find((e) => array.some((gg) => e == gg));
	if (!ll) return dataDefault;
	return ll;
};
// sentence ='1 mp4 medium'
// const parseStringValues = (sentence) => {
//     let option = optionSentence(options, sentence, 'no')
//     let format = optionSentence(formats, sentence, 'mp4')
//     let quality = optionSentence(qualitys, sentence, 'lowest')
//     if (option == 'no') return 'noOption'
//     return { option, format, quality }
// }

const parseStringValues = (sentence) => {
	let option = optionSentence(options, sentence, 'no');
	let format = optionSentence(formats, sentence, 'no');
	let quality = optionSentence(qualitys, sentence, 'no');
	return { option, format, quality };
};

const evalu = (option, format, quality) => {
	// let hasData = 'yes'
	let noData = 'no';
	if (option == noData) {
		return 'noDataOption';
	}
	if (option !== noData && format == noData && quality == noData) {
		return { mode: 1, dataOptions: { option } };
	}

	return {
		mode: 2,
		dataOptions: {
			option: option == 'no' ? '1' : option,
			format: format == 'no' ? 'mp3' : format,
			quality: quality == 'no' ? 'lowest' : quality,
		},
	};
};

const parseStringValues2 = (sentence, qualitysN) => {
	let format = optionSentence(formats, sentence, 'no');
	let numOptionQuality = optionSentence(qualitysN, sentence, 'no');
	return { format, numOptionQuality };
};

const evalu2 = (format, numOptionQuality) => {
	return {
		format: format == 'no' ? 'mp4' : format,
		numOptionQuality: numOptionQuality == 'no' ? '1' : numOptionQuality,
	};
};

const sizeFile = (filePath) => {
	return new Promise((resolve) => {
		fs.stat(filePath, (err, stats) => {
			if (err) {
				console.error(err);
				return;
			}
			const fileSize = stats.size; // Tamaño en bytes
			resolve(fileSize);
		});
	});
};

const totalFileSize = async (arrayNamesFiles) => {
	let promisesFS = arrayNamesFiles.map((anf) => sizeFile(anf));
	const data = await Promise.all(promisesFS);

	let totalSizeInBytes = data.reduce((sum, act) => sum + act, 0);
	let totalSizeInMB = totalSizeInBytes / (1024 * 1024);
	return totalSizeInMB;
};

const checkTotalFileSize = (FileSizeInMB) => {
	if (FileSizeInMB <= 2000) {
		return 'ok';
	}

	return 'passedLimit';
};

async function getVideoInfo(videoURL) {
	try {
		let videos = [];
		let audios = [];
		const info = await ytdl.getInfo(videoURL);
		// console.log(info)

		info.formats.forEach((format, i) => {
			if (
				format.hasVideo == true &&
				format.hasAudio == false &&
				format.container == 'mp4'
			) {
				let { qualityLabel, container, url } = format;

				videos.push({
					index: i,
					qualityLabel: qualityLabel,
					container: container,
					urlDnwl: url,
				});
			} else if (
				format.hasVideo == false &&
				format.hasAudio == true &&
				format.container == 'mp4'
			) {
				let { container, url } = format;

				audios.push({
					index: i,
					container: container,
					urlDnwl: url,
				});
			}
		});

		return { videos: videos.reverse(), audios };
	} catch (error) {
		console.error('Error al obtener la información', error);
	}
}

let dataInfoMesague = (array) => {
	let datamesague = array.reduce((ant, format, i) => {
		return `${ant} ${i + 1} : ${format.qualityLabel} ${format.container} \n`;
	}, '');

	return datamesague;
};

const downloadG = async (url, index, name) => {
	const videoURL = url;

	let outputFilePath = `${name}.mp4`;
	return new Promise(async (resolve) => {
		const info = await ytdl.getInfo(videoURL);
		// console.log('dataformat', index);
		const options = {
			format: info.formats[index],
		};
		ytdl(videoURL, options)
			.pipe(fs.createWriteStream(outputFilePath))
			.on('finish', () => {
				// console.log('Video descargado correctamente.');
				resolve(outputFilePath);
			})
			.on('error', (error) => {
				console.error('Error al descargar el video:', error);
			});
	});
};

const joinVideoAndAudio = (videoPath, audioPath, ouputName) => {
	return new Promise((resolve) => {
		let outputFilePath = `${ouputName}.mp4`;
		const ffmpegCommand = `ffmpeg -y -i ${videoPath} -i ${audioPath} -c:v copy -c:a copy ${outputFilePath}`;
		// console.log(ffmpegCommand)
		const ffmpegProcess = exec(ffmpegCommand);

		ffmpegProcess.on('exit', (code) => {
			if (code === 0) {
				// console.log('La Union se completó exitosamente.');
				resolve(outputFilePath);
			} else {
				console.error('La Union falló con el código de salida:', code);
			}
		});
	});
};
const renameVideo = (path, newPath) => {
	return new Promise((resolve) => {
		fs.rename(path, newPath, (error) => {
			if (error) {
				console.log('error al renombrar', error);
			} else {
				// console.log('renombrado')
				resolve(newPath);
			}
		});
	});
};

const generateRandomName = () => {
	const characters =
		'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	const nameLength = 8;

	let randomName = '';
	for (let i = 0; i < nameLength; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		randomName += characters[randomIndex];
	}

	return randomName;
};

const deleteFile = (arrayFiles) => {
	arrayFiles.map((fileName) => {
		fs.unlink(fileName, (err) => {
			if (err) {
				console.error('Error al borrar el archivo:', err);
			} else {
				// console.log('Archivo borrado exitosamente:', fileName);
			}
		});
	});
};

module.exports = {
	getDataSearch,
	parseSearchData,
	messageCustomFormat,
	convertMP3,
	parseStringValues2,
	parseStringValues,
	evalu,
	evalu2,
	dataInfoMesague,
	getVideoInfo,
	downloadG,
	joinVideoAndAudio,
	totalFileSize,
	checkTotalFileSize,
	renameVideo,
	generateRandomName,
	deleteFile,
};
