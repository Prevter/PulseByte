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
    aliases: ["кью", "черга"],
    arguments: [
        { name: 'page', type: 'number' }
    ],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        if (!translations.hasOwnProperty(locale))
            locale = "en";

        const queue = meta.client.distube.getQueue(meta.message);
        if (!queue) return callback({ type: 'text', content: translations[locale].nothingPlaying });
        
        const page = args.page || 1;
        if (page <= 0 || page > Math.round(queue.songs.length / 10)) return;

        let content = `${translations[locale].serverQueue}\n\`\`\``;

        const startIndex = (page - 1) * 10 + 1;
        const endIndex = startIndex + 10;

        for (var i = startIndex; i < endIndex; i += 1) {
            if (i >= queue.songs.length ) break;

            content += `${i}. ${queue.songs[i].name} - ${queue.songs[i].formattedDuration}\n`;
        }

        content += `\`\`\``;

        // const q = queue.songs.map((song, i) => {
        //     if (i === 0) return '';

        //     if ()

        //     return `${i}. ${song.name} - \`${song.formattedDuration}\``;
        // }).join('\n');

        callback({ type: 'text', content });
    }
}