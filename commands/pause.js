const translations = {
    en: {
        desc: "Pause the music",
        args: {},
        nothingPlaying: "❌ Queue is empty"
    },
    uk: {
        desc: "Поставити музику на паузу",
        args: {},
        nothingPlaying: "❌ Черга порожня"
    },
};

module.exports = {
    name: "pause",
    aliases: ["пауза"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        if (!translations.hasOwnProperty(locale))
            locale = "en";

        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) return callback({ type: 'text', content: translations[locale].nothingPlaying });

        if (queue.paused) {
            queue.resume()
        } else {
            queue.pause();
        }

        callback({ type: 'react', content: '✅' });
    }
}