const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { join } = require('path');
const https = require("https");
const { Translator } = require('../common/utils');
const { createCanvas, GlobalFonts, loadImage } = require('@napi-rs/canvas')

GlobalFonts.registerFromPath(join(__dirname, '../assets/e-UkraineHead-Regular.ttf'), 'e-Ukraine');

// const emojis = {
// 	personnel_units: "<:stats_personnel:1061978201376690276>",
// 	mlrs: "<:stats_MLRS:1061978199854161920>",
// 	vehicles_fuel_tanks: "<:stats_cars:1061978193193611334>",
// 	planes: "<:stats_planes:1061978202618200126>",
// 	uav_systems: "<:stats_UAV:1061978300278382662>",
// 	cruise_missiles: "<:stats_missiles:1061978197417271316>",
// 	tanks: "<:stats_tanks:1061978206313402378>",
// 	helicopters: "<:stats_helicopters:1061978195789877268>",
// 	artillery_systems: "<:stats_cannons:1061978191947890799>",
// 	armoured_fighting_vehicles: "<:stats_armored:1061978190521827348>",
// 	aa_warfare_systems: "<:stats_antiAir:1061978187665526914>",
// 	warships_cutters: "<:stats_ships:1061978204677615710>"
// };

const translations = {
	en: {
		desc: "Get latest stats of russian losses",
		args: {},
		// Embed
		embedTitle: "Enemy losses",
		embedDesc: "According to the General Staff of the AFU",
		embedFooter: "{0}-th day of full-scale invasion ({1})",
		// Image
		thDay: "-th day",
		dataVerifying: "The data is being verified. The calculation is complicated by the high intensity of hostilities",
		// Stats
		personnel_units: "Military personnel",
		planes: "Planes",
		tanks: "Tanks",
		armoured_fighting_vehicles: "Armored Vehicles",
		mlrs: "MLRS",
		uav_systems: "UAV",
		helicopters: "Helicopters",
		aa_warfare_systems: "Anti-aircraft",
		vehicles_fuel_tanks: "Cars",
		cruise_missiles: "Missiles",
		artillery_systems: "Artillery",
		warships_cutters: "Ships",
		special_military_equip: "Special equip.",
		atgm_srbm_systems: "ATGM/SRBM"
	},
	uk: {
		desc: "Отримати останню статистику російських втрат",
		args: {},
		// Embed
		embedTitle: "Втрати ворога",
		embedDesc: "За даними Генерального штабу ЗСУ",
		embedFooter: "{0}-й день повномасштабного вторгнення ({1})",
		// Image
		thDay: "-й день",
		dataVerifying: "Дані уточнюються. Підрахунок ускладнюється високою інтенсивністю бойових дій",
		// Stats
		personnel_units: "Особовий склад",
		planes: "Літаки",
		tanks: "Танки",
		armoured_fighting_vehicles: "Бронемашини",
		mlrs: "РСЗВ",
		uav_systems: "БПЛА",
		helicopters: "Гелікоптери",
		aa_warfare_systems: "ППО",
		vehicles_fuel_tanks: "Машини",
		cruise_missiles: "Ракети",
		artillery_systems: "Артилерія",
		warships_cutters: "Кораблі",
		special_military_equip: "Спец. техніка",
		atgm_srbm_systems: "ОТРК/ТРК"
	},
};

module.exports = {
	name: "war",
	category: "utils",
	aliases: ["втрати", "русня", "кіллфід", "війна", "шопорусні?"],
	arguments: [],
	translations: translations,
	run: async (args, db, locale, callback, meta) => {
		let translate = new Translator(translations, locale);

		// const createEmbed = (response) => {
		// 	let embed = new EmbedBuilder()
		// 		.setColor(0x0099FF)
		// 		.setTitle(translate('embedTitle'))
		// 		.setDescription(translate('embedDesc'));

		// 	embed.setFooter({ text: translate('embedFooter', response.day, response.date) });

		// 	for (const [type, emoji] of Object.entries(emojis)) {
		// 		var valueStr = response.stats[type].toLocaleString('en-US').replace(',', ' ');

		// 		const delta = response.increase[type];
		// 		if (delta) valueStr += ` \`(+${delta})\``;

		// 		embed.addFields({
		// 			name: `${emoji} ${translate(type)}`,
		// 			value: valueStr,
		// 			inline: true
		// 		});
		// 	}

		// 	callback({ type: 'embed', content: embed });
		// }

		const createImage = async (response) => {
			const canvas = createCanvas(1280, 1080);
			const ctx = canvas.getContext('2d');

			const text = (text, x, y, maxWidth, fontSize, color = '#000000', align = 'left') => {
				ctx.save();
				ctx.font = `${fontSize}px e-Ukraine`;
				ctx.fillStyle = color;
				ctx.textAlign = align;
				ctx.textBaseline = 'top';
				ctx.fillText(text, x, y, maxWidth);
				ctx.restore();
			}

			const calculateTextWidth = (text, fontSize) => {
				ctx.save();
				ctx.font = `${fontSize}px e-Ukraine`;
				const width = ctx.measureText(text).width;
				ctx.restore();
				return width;
			}

			const background = await loadImage(join(__dirname, '../assets/stats_template.png'));
			ctx.save();
			ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
			ctx.restore();

			text(translate('embedTitle'), 35, 50, 800, 94, '#ffffff');
			text(translate('embedDesc'), 45, 150, 800, 38, '#ffffff');

			response.day = response.day.toString();
			const dayLabelCenterX = 1065;
			const dayWidth = calculateTextWidth(response.day, 90);
			const dayLabelWidth = calculateTextWidth(translate('thDay'), 30);
			const centerWidth = (dayWidth + dayLabelWidth) / 2;
			const offsetDay = (dayWidth / 2) - centerWidth;
			const offsetDayLabel = (dayLabelWidth / 2) - centerWidth;
			text(response.day, dayLabelCenterX + offsetDay, 55, 330, 90, '#000', 'center');
			text(translate('thDay'), dayLabelCenterX - offsetDayLabel, 105, 330, 30, '#000', 'center');
			text(response.date, dayLabelCenterX, 155, 330, 36, '#000', 'center');
			
			text(translate('dataVerifying'), canvas.width / 2, 1035, 1150, 24, '#ffffff', 'center');

			const stats = response.stats;
			const increase = response.increase;

			const bigCard = (x, y, title, value, delta) => {
				const numberStr = value.toLocaleString('en-US').replace(',', ' ');
				text(numberStr, x, y, 390, 38, '#000');
				const numberWidth = calculateTextWidth(numberStr, 38);
				if (delta) {
					const deltaStr = `(+${delta.toLocaleString('en-US').replace(',', ' ')})`;
					text(deltaStr, x + numberWidth + 10, y + 5, 390, 24, '#000');
				}
				text(title, x, y + 40, 390, 36, '#000');
			}

			const smallCard = (x, y, title, value, delta) => {
				const numberStr = value.toLocaleString('en-US').replace(',', ' ');
				text(numberStr, x, y, 250, 30, '#000');
				const numberWidth = calculateTextWidth(numberStr, 30);
				if (delta) {
					const deltaStr = `(+${delta.toLocaleString('en-US').replace(',', ' ')})`;
					text(deltaStr, x + numberWidth + 10, y + 5, 250, 18, '#000');
				}
				text(title, x, y + 32, 250, 30, '#000');
			}

			const card = (x, y, type, name) => {
				if (type == 'small')
					smallCard(x, y, translate(name), stats[name], increase[name]);
				else
					bigCard(x, y, translate(name), stats[name], increase[name]);
			}

			card(250, 280, 'big', 'personnel_units');
			card(870, 280, 'big', 'tanks');
			card(180, 440, 'small', 'armoured_fighting_vehicles');
			card(570, 440, 'small', 'artillery_systems');
			card(960, 440, 'small', 'mlrs');
			card(180, 585, 'small', 'aa_warfare_systems');
			card(570, 585, 'small', 'planes');
			card(960, 585, 'small', 'helicopters');
			card(180, 740, 'small', 'vehicles_fuel_tanks');
			card(570, 740, 'small', 'warships_cutters');
			card(960, 740, 'small', 'uav_systems');
			card(180, 890, 'small', 'special_military_equip');
			card(570, 890, 'small', 'atgm_srbm_systems');
			card(960, 890, 'small', 'cruise_missiles');

			const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'stats.png' });
			callback({ type: 'attachment', content: attachment });
		}

		const url = "https://russianwarship.rip/api/v2/statistics/latest";
		https.get(url, function (res) {
			var body = '';

			res.on('data', function (chunk) {
				body += chunk;
			});

			res.on('end', function () {
				var response = JSON.parse(body).data;
				response.date = response.date.split('-').reverse().join('.');

				createImage(response);
			});
		}).on('error', function (e) {
			console.log("Got an error: ", e);
		});
	}
}