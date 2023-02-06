const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Play previous song",
        args: {},
        nothingPlaying: "❌ Queue is empty"
    },
    uk: {
        desc: "Програти попередню пісню",
        args: {},
        nothingPlaying: "❌ Черга порожня"
    },
};

module.exports = {
    name: "previous",
    category: "music",
    aliases: ["prev", "back", "назад", "попередня", "прев", "превіус"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) return callback({ type: 'text', content: translate('nothingPlaying') });
        
        const song = queue.previous();
    }
}