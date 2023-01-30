const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Automatically launch next recommended song",
        args: {},
        nothingPlaying: "❌ Queue is empty",
        turnedOn: "Autoplay turned on",
        turnedOff: "Autoplay turned off"
    },
    uk: {
        desc: "Автоматично запускати наступну рекомендовану пісню",
        args: {},
        nothingPlaying: "❌ Черга порожня",
        turnedOn: "Автоплей увімкнуто",
        turnedOff: "Автоплей вимкнуто"
    },
};

module.exports = {
    name: "autoplay",
    aliases: ["auto", "авто", "автоплей"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);
        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) return callback({ type: 'text', content: translate('nothingPlaying') });
        const autoplay = queue.toggleAutoplay()
        callback({ type: 'text', content: translate(autoplay ? 'turnedOn' : 'turnedOff') });
    }
}