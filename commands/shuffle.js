const translations = {
    en: {
        desc: "Shuffles songs in queue",
        args: {},
        nothingPlaying: "❌ Queue is empty"
    },
    uk: {
        desc: "Перемішує пісні в черзі",
        args: {},
        nothingPlaying: "❌ Черга порожня"
    },
};

module.exports = {
    name: "shuffle",
    aliases: ["шафл", "перемішати", "рандом", "random"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        if (!translations.hasOwnProperty(locale))
            locale = "en";

        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) return callback({ type: 'text', content: translations[locale].nothingPlaying });
        try {
            await queue.shuffle();
            callback({ type: 'react', content: '✅' });
        } catch (e) {
            console.log(e);
            callback({ type: 'react', content: '❌' });
        }
    }
}