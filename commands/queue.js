const translations = {
    en: {
        desc: "Get current music queue",
        args: {},
        serverQueue: "🎶 Current queue:",
        nothingPlaying: "❌ Queue is empty"
    },
    uk: {
        desc: "Дізнатись поточну чергу музики",
        args: {},
        serverQueue: "🎶 Поточна черга:",
        nothingPlaying: "❌ Черга порожня"
    },
};

module.exports = {
    name: "queue",
    aliases: ["кью", "черга"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        if (!translations.hasOwnProperty(locale))
            locale = "en";

        const queue = meta.client.distube.getQueue(meta.message);
        if (!queue) return callback({ type: 'text', content: translations[locale].nothingPlaying });
        const q = queue.songs.map((song, i) => {
            if (i === 0) return '';
            return `${i}. ${song.name} - \`${song.formattedDuration}\``;
        }).join('\n');
        callback({ type: 'text', content: `${translations[locale].serverQueue}\n${q}` });
    }
}