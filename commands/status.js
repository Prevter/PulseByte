const { EmbedBuilder } = require('discord.js');
const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Get bot status",
        args: {},
        embedTitle: "Bot status",
        embedDesc: "I am active on {0} servers",
        ping: "🏓 Ping",
        milliseconds: "ms",
        memoryUsage: "📈 Memory usage",
        megabytes: "MB",
        uptime: "🕒 Uptime",
        dayParser: (days) => days === 1 ? "day" : "days",
        nodeVersion: "Node.js version: {0}",
    },
    uk: {
        desc: "Отримати статус бота",
        args: {},
        embedTitle: "Статус бота",
        embedDesc: "Я активний на {0} серверах",
        ping: "🏓 Пінг",
        milliseconds: "мс",
        memoryUsage: "📈 Використання пам'яті",
        megabytes: "МБ",
        uptime: "🕒 Час роботи",
        dayParser: (days) => {
            if (days % 10 === 1 && days % 100 !== 11)
                return 'день';
            else if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20))
                return 'дні';
            else
                return 'днів';
        },
        nodeVersion: "Версія Node.js: {0}",
    },
};

const timeString = (timePassed, translate) => {
    let seconds = Math.floor(timePassed % 60);
    let minutes = Math.floor(timePassed / 60) % 60;
    let hours = Math.floor(timePassed / 3600) % 24;
    let days = Math.floor(timePassed / 86400);
    let result = '';
    if (days > 0)
        result += `${days} ${translate('dayParser', days)} `;
    if (hours > 0 || result.length > 0)
        result += `${hours}:`;
    if (minutes > 0 || result.length > 0)
        result += `${minutes < 10 ? '0' : ''}${minutes}:`;
    else
        result += `${minutes}:`;
    result += `${seconds < 10 ? '0' : ''}${seconds}`;
    return result;
};

module.exports = {
    name: "status",
    category: "general",
    aliases: ["stat", "статус", "стат", "vol", "info", "інфо"],
    arguments: [],
    translations: translations,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        const serverCount = meta.client.guilds.cache.size;
        const ping = meta.client.ws.ping;
        const uptime = meta.client.uptime;
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        const nodeVersion = process.version;

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(translate('embedTitle'))
            .setDescription(translate('embedDesc', serverCount))
            .addFields({
                name: translate('ping'),
                value: ping + translate('milliseconds'),
                inline: true
            }, {
                name: translate('uptime'),
                value: timeString(uptime / 1000, translate),
                inline: true
            }, {
                name: translate('memoryUsage'),
                value: memoryUsage.toFixed(2) + translate('megabytes'),
                inline: true
            })
            .setFooter({ text: translate('nodeVersion', nodeVersion) })

        callback({ type: 'embed', content: embed });
    }
}