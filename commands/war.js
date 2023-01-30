const { EmbedBuilder } = require('discord.js');
const https = require("https");
const { Translator } = require('../common/utils');

const emojis = {
	personnel: "<:stats_personnel:1061978201376690276>",
	planes: "<:stats_planes:1061978202618200126>",
	tanks: "<:stats_tanks:1061978206313402378>",
	armoredVehicles: "<:stats_armored:1061978190521827348>",
	MLRS: "<:stats_MLRS:1061978199854161920>",
	UAV: "<:stats_UAV:1061978300278382662>",
	helicopters: "<:stats_helicopters:1061978195789877268>",
	antiAir: "<:stats_antiAir:1061978187665526914>",
	cars: "<:stats_cars:1061978193193611334>",
	missiles: "<:stats_missiles:1061978197417271316>",
	cannons: "<:stats_cannons:1061978191947890799>",
	ships: "<:stats_ships:1061978204677615710>"
};


const translations = {
	en: {
		desc: "Get latest stats of russian losses",
		args: {},
		embedTitle: "Enemy losses",
		embedDesc: "According to the General Staff of the Armed Forces of Ukraine",
		personnel: "Military personnel",
		planes: "Planes",
		tanks: "Tanks",
		armoredVehicles: "Armored Vehicles",
		MLRS: "MLRS",
		UAV: "UAV",
		helicopters: "Helicopters",
		antiAir: "Anti-aircraft",
		cars: "Cars",
		missiles: "Missiles",
		cannons: "Cannons",
		ships: "Ships"
	},
	uk: {
		desc: "Отримати останню статистику російських втрат",
		args: {},
		embedTitle: "Втрати ворога",
		embedDesc: "За даними Генерального штабу ЗСУ",
		personnel: "Особовий склад",
		planes: "Літаки",
		tanks: "Танки",
		armoredVehicles: "Броньовані машини",
		MLRS: "РСЗВ",
		UAV: "БПЛА",
		helicopters: "Гелікоптери",
		antiAir: "ППО",
		cars: "Машини",
		missiles: "Ракети",
		cannons: "Артилерія",
		ships: "Кораблі"
	},
};

module.exports = {
	name: "war",
	aliases: ["втрати", "русня", "кіллфід", "війна", "шопорусні?"],
	arguments: [],
	translations: translations,
	run: async (args, db, locale, callback, meta) => {
		let translate = new Translator(translations, locale);

		let embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(translate('embedTitle'))
			.setDescription(translate('embedDesc'));

		const url = "https://prevter.ml/api/misc/warStats";
		https.get(url, function (res) {
			var body = '';

			res.on('data', function (chunk) {
				body += chunk;
			});

			res.on('end', function () {
				var response = JSON.parse(body);
				embed.setFooter({ text: response.date });

				for (const [type, emoji] of Object.entries(emojis)) {
					var valueStr = response[type].toLocaleString('en-US').replace(',', ' ');

					const delta = response.delta[type];
					if (delta) valueStr += ` \`(+${delta})\``;

					embed.addFields({
						name: `${emoji} ${translate(type)}`,
						value: valueStr,
						inline: true
					});
				}

				callback({ type: 'embed', content: embed });
			});
		}).on('error', function (e) {
			console.log("Got an error: ", e);
		});
	}
}