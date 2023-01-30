const { EmbedBuilder } = require('discord.js');

const translations = {
    en: {
        desc: "Get bot status",
        args: {},
        embedTitle: "Bot status",
        embedDesc: "I am active on %0 servers",
        ping: "🏓 Ping",
        milliseconds: "ms",
        memoryUsage: "📈 Memory usage",
        megabytes: "MB",
        uptime: "🕒 Uptime",
        dayParser: (days) => days === 1 ? "day" : "days",
        nodeVersion: "Node.js version: %0",
    },
    uk: {
        desc: "Отримати статус бота",
        args: {},
        embedTitle: "Статус бота",
        embedDesc: "Я активний на %0 серверах",
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
        nodeVersion: "Версія Node.js: %0",
    },
};

const timeString = (timePassed, locale) => {
    let seconds = Math.floor(timePassed % 60);
    let minutes = Math.floor(timePassed / 60) % 60;
    let hours = Math.floor(timePassed / 3600) % 24;
    let days = Math.floor(timePassed / 86400);
    let result = '';
    if (days > 0)
        result += `${days} ${translations[locale].dayParser(days)} `;
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
    aliases: ["stat", "статус", "стат", "vol", "info", "інфо"],
    arguments: [],
    translations: translations,
    run: async (args, db, locale, callback, meta) => {
        if (!translations.hasOwnProperty(locale))
            locale = "en";

        const serverCount = meta.client.guilds.cache.size;
        const ping = meta.client.ws.ping;
        const uptime = meta.client.uptime;
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        const nodeVersion = process.version;

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle(translations[locale].embedTitle)
            .setDescription(translations[locale].embedDesc.replace("%0", serverCount))
            .addFields({
                name: translations[locale].ping,
                value: ping + translations[locale].milliseconds,
                inline: true
            }, {
                name: translations[locale].uptime,
                value: timeString(uptime / 1000, locale),
                inline: true
            }, {
                name: translations[locale].memoryUsage,
                value: memoryUsage.toFixed(2) + translations[locale].megabytes,
                inline: true
            })
            .setFooter({ text: translations[locale].nodeVersion.replace("%0", nodeVersion) })
        
        callback({ type: 'embed', content: embed });
    }
}