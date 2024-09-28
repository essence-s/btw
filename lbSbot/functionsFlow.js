const mime = require('mime-types');
const fs = require('fs');

class FunctionsFlow {
	constructor(sock, remoteJid) {
		this.sock = sock;
		this.remoteJid = remoteJid;
		this.dataUser = {};
		this.flow = {};
		this.statusFallBack = false;
	}

	async sendMessage(text) {
		// console.log(this.statusFallBack)
		await this.sock.sendMessage(this.remoteJid, { text: text });
	}

	async sendFile(filePath) {
		const mimeType = mime.lookup(filePath);
		const fileName = filePath.split('/').pop();
		const buffer = fs.readFileSync(filePath);
		await this.sock.sendMessage(this.remoteJid, {
			document: buffer,
			mimetype: mimeType,
			fileName: fileName,
		});
		// const mimeType = mime.lookup(filePath);
		// const fileName = filePath.split('/').pop();
		// const buffer = fs.readFileSync(filePath);
		// await this.sock.sendMessage(this.remoteJid, {
		// 	document: { stream: filePath },
		// 	// mimetype: mimeType,
		// 	fileName: 'dinosaurio',
		// });
		// await this.sock.sendMessage(this.remoteJid, {
		//     document: { url: filePath },
		//     mimetype: mimeType,
		//     fileName: fileName,
		// })
	}

	async endFlow(text) {
		this.dataUser.currentSection = 0;
		this.dataUser.flowCurrent = '';
		await this.sendMessage(text);
		this.changeFallback(true);
	}

	async fallBack() {
		let currentSection = this.dataUser.currentSection;
		await this.sendMessage(this.flow.data[currentSection].word);
		this.changeFallback(true);
	}

	changeFallback(dataBolean) {
		this.statusFallBack = dataBolean;
	}

	addDataUser(data) {
		this.dataUser = data;
	}
	addFlow(data) {
		this.flow = data;
	}
}

module.exports = { FunctionsFlow };
