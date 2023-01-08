const { PermissionsBitField, EmbedBuilder } = require('discord.js');
const https = require("https");

const emojis = {
	personnel: "<:stats_personnel:1061443781569810513>",
	planes: "",
	tanks: "",
	armoredVehicles: "",
	MLRS: "",
	UAV: "",
	helicopters: "",
	antiAir: "",
	cars: "",
	missiles: "",
	cannons: "",
	ships: ""
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
		if(!translations.hasOwnProperty(locale)) 
			locale = "en";
			
		let embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTitle(translations[locale].embedTitle)
			.setDescription(translations[locale].embedDesc);
		
		const url = "https://prevter.ml/api/misc/warStats";
		https.get(url, function(res){
			var body = '';
			
			res.on('data', function(chunk) {
				body += chunk;
			});

			res.on('end', function() {
				var response = JSON.parse(body);
				embed.setFooter({ text: response.date });
				
				for (const [type, emoji] of Object.entries(emojis)){
					var valueStr = response[type].toLocaleString('en-US').replace(',',' ');
					
					const delta = response.delta[type];
					if (delta) valueStr += ` (+${delta})`;
					
					embed.addFields({
						name: `${emoji} ${translations[locale][type]}`,
						value: valueStr,
						inline: true
					});
				}
				
				console.log(response);
				callback({ type: 'embed', content: embed });
			});
		}).on('error', function(e){
			console.log("Got an error: ", e);
		});
	}
}