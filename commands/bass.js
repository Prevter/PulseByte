const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Add bassboost to the song",
        args: {},
        nothingPlaying: "❌ Queue is empty",
        turnedOn: "✅ Bassboost turned on",
        turnedOff: "🟥 Bassboost turned off",
    },
    uk: {
        desc: "Додати бассбуст до пісні",
        args: {},
        nothingPlaying: "❌ Черга порожня",
        turnedOn: "✅ Бассбуст увімкнено",
        turnedOff: "🟥 Бассбуст вимкнено",
    },
};

module.exports = {
    name: "bass",
    category: "music",
    aliases: ["басс", "bassboost", "басбуст", "бас", "бассбуст"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);
        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) return callback({ type: 'text', content: translate('nothingPlaying') });

        if (queue.filters.has("bassboost")) {
            queue.filters.remove("bassboost");
            callback({ type: 'text', content: translate('turnedOff') });
        } else {
            queue.filters.add("bassboost");
            callback({ type: 'text', content: translate('turnedOn') });
        }
    }
}