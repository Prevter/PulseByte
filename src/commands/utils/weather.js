const Command = require("../../types/command");

const weatherIcons = {
    '01d': 'https://media.discordapp.net/attachments/793553851398750208/1114241064019165325/01d.png',
    '01n': 'https://media.discordapp.net/attachments/793553851398750208/1114241064413438023/01n.png',
    '02d': 'https://media.discordapp.net/attachments/793553851398750208/1114241064665108510/02d.png',
    '02n': 'https://media.discordapp.net/attachments/793553851398750208/1114241064950300692/02n.png',
    '03d': 'https://media.discordapp.net/attachments/793553851398750208/1114241062253363200/03d.png',
    '03n': 'https://media.discordapp.net/attachments/793553851398750208/1114241074412667000/03n.png',
    '04d': 'https://media.discordapp.net/attachments/793553851398750208/1114241074764976238/04d.png',
    '04n': 'https://media.discordapp.net/attachments/793553851398750208/1114241075041816618/04n.png',
    '09d': 'https://media.discordapp.net/attachments/793553851398750208/1114241074140041256/09d.png',
    '09n': 'https://media.discordapp.net/attachments/793553851398750208/1114241062475669554/09n.png',
    '10d': 'https://media.discordapp.net/attachments/793553851398750208/1114241062735728690/10d.png',
    '10n': 'https://media.discordapp.net/attachments/793553851398750208/1114241063046086727/10n.png',
    '11d': 'https://media.discordapp.net/attachments/793553851398750208/1114241063406805183/11d.png',
    '11n': 'https://media.discordapp.net/attachments/793553851398750208/1114241063713001593/11n.png'
};

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'weather',
            aliases: [],
            category: 'utils',
            args: [{
                name: 'city',
                type: 'string',
                required: true
            }]
        });
    }

    async loadWeatherData(city, locale) {
        if (city.length === 0)
            return Command.createErrorEmbed('weather.no_city');

        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${this.config.weather_api_key}&lang=${locale('_locale')}&units=metric`;
        const response = await Command.fetch(url);

        if (response.cod === '404')
            return Command.createErrorEmbed(locale('weather.not_found'));

        const timezone_hours = response.timezone / 3600;
        const gmt_string = `GMT${timezone_hours > 0 ? '+' : ''}${timezone_hours}`
        const offset_ms = response.timezone * 1000;
        const timestamp = new Date().getTime() + offset_ms;

        return Command.createEmbed({
            title: locale('weather.title', response.name),
            description: locale('weather.description', response.main.temp, response.weather[0].description),
            thumbnail: weatherIcons[response.weather[0].icon],
            fields: [
                {
                    name: locale('weather.feels_like'),
                    value: `${response.main.feels_like}°C`,
                    inline: true
                },
                {
                    name: locale('weather.humidity'),
                    value: `${response.main.humidity}%`,
                    inline: true
                },
                {
                    name: locale('weather.wind'),
                    value: locale('weather.wind_format', response.wind.speed, response.wind.deg),
                    inline: true
                },
                {
                    name: locale('weather.clouds'),
                    value: `${response.clouds.all}%`,
                    inline: true
                },
                {
                    name: locale('weather.pressure'),
                    value: locale('weather.pressure_format', response.main.pressure),
                    inline: true
                },
                {
                    name: locale('weather.visibility'),
                    value: locale('weather.visibility_format', response.visibility),
                    inline: true
                },
                {
                    name: locale('weather.sunrise'),
                    value: `${this.formatDate(response.sys.sunrise * 1000 + offset_ms, 'HH:mm:ss')} ${gmt_string}`,
                    inline: true
                },
                {
                    name: locale('weather.sunset'),
                    value: `${this.formatDate(response.sys.sunset * 1000 + offset_ms, 'HH:mm:ss')} ${gmt_string}`,
                    inline: true
                },
                {
                    name: locale('weather.local_time'),
                    value: `${this.formatDate(timestamp, 'HH:mm:ss')} ${gmt_string}`,
                    inline: true
                }
            ],
            footer: { text: 'openweathermap.org' },
        });
    }

    async runAsSlash(interaction, locale, args) {
        const city = args.city;
        await interaction.deferReply();
        const result = await this.loadWeatherData(city, locale);
        await interaction.editReply({ embeds: [result] });
    }

    async run(message, locale, args) {
        if (args.length < 1)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('weather.no_city'))] });

        const city = args.join(' ');
        const result = await this.loadWeatherData(city, locale);
        await message.reply({ embeds: [result] });
    }
}