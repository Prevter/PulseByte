const { Translator } = require('../common/utils');

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
    category: "music",
    aliases: ["резюм", "продовжити"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) return callback({ type: 'text', content: translate('nothingPlaying') });

        if (queue.paused) {
            queue.resume();
            callback({ type: 'react', content: '✅' });
        }
    }
}