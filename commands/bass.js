const translations = {
    en: {
        desc: "Add bassboost to the song",
        args: {},
        nothingPlaying: "❌ Queue is empty"
    },
    uk: {
        desc: "Додати бассбуст до пісні",
        args: {},
        nothingPlaying: "❌ Черга порожня"
    },
};

module.exports = {
    name: "bass",
    aliases: ["басс", "bassboost", "басбуст", "бас", "бассбуст"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        if (!translations.hasOwnProperty(locale))
            locale = "en";

        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) return callback({ type: 'text', content: translations[locale].nothingPlaying });

        if (queue.filters.has("bassboost")) {
            queue.filters.remove("bassboost");
        } else {
            queue.filters.add("bassboost");
        }
        callback({ type: 'react', content: '✅' });
    }
}