const translations = {
    en: {
        desc: "Resume the music",
        args: {},
        nothingPlaying: "❌ Queue is empty"
    },
    uk: {
        desc: "Продовжити музику",
        args: {},
        nothingPlaying: "❌ Черга порожня"
    },
};

module.exports = {
    name: "resume",
    aliases: ["резюм", "продовжити"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        if (!translations.hasOwnProperty(locale))
            locale = "en";

        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) return callback({ type: 'text', content: translations[locale].nothingPlaying });

        if (queue.paused) {
            queue.resume();
            callback({ type: 'react', content: '✅' });
        }
    }
}