const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Set music volume",
        args: {
            volume: "Volume (from 0 to 500)"
        },
        nothingPlaying: "❌ Queue is empty",
        specifyVolume: "Please specify volume from 0 to 500\nCurrent volume: {0}"
    },
    uk: {
        desc: "Встановити гучність музики",
        args: {
            volume: "Гучність (від 0 до 500)"
        },
        nothingPlaying: "❌ Черга порожня",
        specifyVolume: "Будь-ласка вкажіть гучність від 0 до 500\nПоточна гучність: {0}"
    },
};

module.exports = {
    name: "volume",
    category: "music",
    aliases: ["v", "г", "гучність", "vol", "гуч", "волюм"],
    arguments: [
        {
            name: "volume",
            type: "number",
        }
    ],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue)
            return callback({ type: 'text', content: translate('nothingPlaying') });

        if (!args.volume || args.volume < 0 || args.volume > 500)
            return callback({ type: 'text', content: translate('specifyVolume', queue.volume) });

        queue.setVolume(args.volume);
        callback({ type: 'react', content: '✅' });
    }
}