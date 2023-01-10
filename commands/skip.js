const translations = {
    en: {
        desc: "Skip current song in queue",
        args: {},
        nothingPlaying: "❌ Queue is empty"
    },
    uk: {
        desc: "Пропустити поточну пісню в черзі",
        args: {},
        nothingPlaying: "❌ Черга порожня"
    },
};

module.exports = {
    name: "skip",
    aliases: ["s", "с", "скіп", "скип", "next", "n", "некст", "н", "наступне", "пропусти"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        if (!translations.hasOwnProperty(locale))
            locale = "en";

        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) return callback({ type: 'text', content: translations[locale].nothingPlaying });
        try {
            await queue.skip();
            callback({ type: 'react', content: '✅' });
        } catch (e) {
            console.log(e);
            callback({ type: 'react', content: '❌' });
        }
    }
}