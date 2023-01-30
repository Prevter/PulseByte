const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Get current music queue",
        args: {
            page: "Page"
        },
        serverQueue: "🎶 Current queue:",
        nothingPlaying: "❌ Queue is empty"
    },
    uk: {
        desc: "Дізнатись поточну чергу музики",
        args: {
            page: "Сторінка"
        },
        serverQueue: "🎶 Поточна черга:",
        nothingPlaying: "❌ Черга порожня"
    },
};

module.exports = {
    name: "queue",
    category: "music",
    aliases: ["кью", "черга"],
    arguments: [
        { name: 'page', type: 'number' }
    ],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        const queue = meta.client.distube.getQueue(meta.message);
        if (!queue) return callback({ type: 'text', content: translate('nothingPlaying') });
        
        const page = args.page || 1;
        if (page <= 0 || page > Math.round(queue.songs.length / 10)) return;

        let content = `${translate('serverQueue')}\n\`\`\``;

        const startIndex = (page - 1) * 10 + 1;
        const endIndex = startIndex + 10;

        for (var i = startIndex; i < endIndex; i += 1) {
            if (i >= queue.songs.length ) break;

            content += `${i}. ${queue.songs[i].name} - ${queue.songs[i].formattedDuration}\n`;
        }

        content += `\`\`\``;

        callback({ type: 'text', content });
    }
}