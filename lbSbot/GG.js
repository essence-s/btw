const {
	default: makeWASocket,
	DisconnectReason,
	useMultiFileAuthState,
} = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const log = (pino = require('pino'));

const { FunctionsFlow } = require('./functionsFlow.js');
const { getCurrent, saveCurretSection, stableCurrent } = require('./users.js');

class Connectbaileys {
	vendor;
	constructor(dataFlows) {
		this.dataFlows = dataFlows;
	}

	initBailey = async () => {
		const { state, saveCreds } = await useMultiFileAuthState('bot_sessions');
		const sock = makeWASocket({
			// can provide additional config here
			// printQRInTerminal: true,
			auth: state,
			logger: log({ level: 'silent' }),
		});
		// sock.sendMessage('ds',{document:'',fileName,mimetype})
		sock.ev.on('connection.update', (update) => {
			const { connection, lastDisconnect } = update;
			if (connection === 'close') {
				const shouldReconnect =
					new Boom(lastDisconnect.error)?.output?.statusCode !==
					DisconnectReason.loggedOut;
				// console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
				console.log('connection closed ,reconnecting ');
				// reconnect if not logged out
				if (shouldReconnect) {
					this.initBailey();
				}
			} else if (connection === 'open') {
				console.log('opened connection');
				this.initSo(sock);
			}
		});

		sock.ev.on('creds.update', saveCreds);
	};

	initSo(sock) {
		this.vendor = sock;
		this.vendor.ev.on('messages.upsert', async (m) => {
			// console.log(m);
			if (m.messages[0]?.key.fromMe) return;
			let remoteJid = m.messages[0].key.remoteJid;
			let message;
			let otherMe1 = m.messages[0].message?.conversation;
			let otherMe2 = m.messages[0].message?.extendedTextMessage.text;
			console.log({ message: m.messages[0].message });
			if (otherMe1) {
				message = otherMe1;
			} else if (otherMe2) {
				message = otherMe2;
			} else {
				await this.vendor.sendMessage(remoteJid, {
					text: 'error intente de nuevo',
				});
				return;
			}

			let numberT = remoteJid.split('@')[0];

			stableCurrent(numberT);
			let flowCurrent9 = getCurrent(numberT);

			this.dataFlows.forEach(async (flow) => {
				if (flow.invo == flowCurrent9.flowCurrent) {
					let functionsFlow = new FunctionsFlow(this.vendor, remoteJid);
					functionsFlow.addDataUser(flowCurrent9);
					functionsFlow.addFlow(flow);
					m.messages[0].message.conversation = message;
					await LL(numberT, flow, m, functionsFlow);
					// console.log('1', users)
				} else {
					if (flow.invo == message) {
						let sectionFunction = flowCurrent9.currentSection;
						await this.vendor.sendMessage(remoteJid, {
							text: flow.data[sectionFunction].word,
						});
						flowCurrent9.flowCurrent = flow.invo;
						// console.log('2', users)
					}
				}
			});
		});
	}
}

const LL = async (numberT, flow, m, functionsFlow) => {
	let sectionFunction = getCurrent(numberT).currentSection;

	await flow.data[sectionFunction].execfunction({
		ctx: m,
		sendMessage: (text) => functionsFlow.sendMessage(text),
		sendFile: (file) => functionsFlow.sendFile(file),
		endFlow: (text) => functionsFlow.endFlow(text),
		fallBack: () => functionsFlow.fallBack(),
	});
	if (!functionsFlow.statusFallBack) {
		if (sectionFunction + 1 < flow.data.length) {
			await functionsFlow.sendMessage(flow.data[sectionFunction + 1].word);
		}
		saveCurretSection(numberT, flow.data.length);
	}
};

module.exports = { Connectbaileys };
