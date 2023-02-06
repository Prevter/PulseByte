const { Translator } = require('../common/utils');
const createEmbed = require('../common/playingEmbed');

const translations = {
    en: {
        desc: "Skip current song in queue",
        args: {
            number: "Number of songs to skip"
        },
        nothingPlaying: "❌ Queue is empty"
    },
    uk: {
        desc: "Пропустити поточну пісню в черзі",
        args: {
            number: "Кількість пісень для пропуску"
        },
        nothingPlaying: "❌ Черга порожня"
    },
};

module.exports = {
    name: "skip",
    category: "music",
    aliases: ["s", "с", "скіп", "скип", "next", "n", "некст", "н", "наступне", "пропусти"],
    arguments: [
        {
            name: "number",
            type: "number"
        }
    ],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) return callback({ type: 'text', content: translate('nothingPlaying') });
        try {
            const number = args.number || 1;
            if (isNaN(number) || number < 1)
                number = 1;

            if (number > 1) {
                await queue.jump(number);
            } else {
                if (queue.songs.length > 1)
                    await queue.skip();
                else {
                    await queue.stop();
                }
            }
            callback({ type: 'react', content: '✅' });
        } catch (e) {
            console.log(e);
            callback({ type: 'react', content: '❌' });
        }
    }
}