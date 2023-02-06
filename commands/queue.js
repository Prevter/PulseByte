const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Get current music queue",
        args: {
            page: "Page"
        },
        serverQueue: "🎶 Current queue ({0}):",
        nothingPlaying: "❌ Queue is empty",
        page: "Page {0} of {1} ({2} songs)",
    },
    uk: {
        desc: "Дізнатись поточну чергу музики",
        args: {
            page: "Сторінка"
        },
        serverQueue: "🎶 Поточна черга ({0}):",
        nothingPlaying: "❌ Черга порожня",
        page: "Сторінка {0} з {1} ({2} пісень)",
    },
};

const secondsToHms = (s) => {
    var h = Math.floor(s / 3600);
    var m = Math.floor(s % 3600 / 60);
    var s = Math.floor(s % 3600 % 60);

    // hours part is optional
    var hDisplay = h > 0 ? h + ":" : "";
    var mDisplay = m < 10 ? "0" + m + ":" : m + ":";
    var sDisplay = s < 10 ? "0" + s : s;
    
    return hDisplay + mDisplay + sDisplay;
};

module.exports = {
    name: "queue",
    category: "music",
    aliases: ["q", "кью", "черга"],
    arguments: [
        { name: 'page', type: 'number' }
    ],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        const queue = meta.client.distube.getQueue(meta.message);
        if (!queue) 
            return callback({ type: 'text', content: translate('nothingPlaying') });

        
        let totalDuration = 0;
        for (var i = 0; i < queue.songs.length; i += 1) {
            totalDuration += queue.songs[i].duration;
        }
        // convert seconds to H:MM:SS
        totalDuration = secondsToHms(totalDuration);

        let page = args.page || 1;
        const maxPages = Math.round(queue.songs.length / 10);
        if (page <= 0 || page > maxPages) 
            page = 1;

        let content = `${translate('serverQueue', totalDuration)}\n\`\`\``;

        const startIndex = (page - 1) * 10;
        const endIndex = startIndex + 10;
        
        for (var i = startIndex; i < endIndex; i += 1) {
            if (i >= queue.songs.length) break;
            const index = i === 0 ? '▶️' : i + 1;
            content += `${index}. ${queue.songs[i].name} - ${queue.songs[i].formattedDuration}\n`;
        }

        content += `\`\`\`${translate('page', page, maxPages, queue.songs.length)}`;

        callback({ type: 'text', content });
    }
}