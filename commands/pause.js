const { Translator } = require('../common/utils');

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
        let translate = new Translator(translations, locale);

        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) return callback({ type: 'text', content: translate('nothingPlaying') });

        if (queue.paused) {
            queue.resume()
        } else {
            queue.pause();
        }

        callback({ type: 'react', content: '✅' });
    }
}