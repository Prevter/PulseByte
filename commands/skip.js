const { Translator } = require('../common/utils');
const createEmbed = require('../common/playingEmbed');

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
    category: "music",
    aliases: ["s", "с", "скіп", "скип", "next", "n", "некст", "н", "наступне", "пропусти"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        const queue = meta.client.distube.getQueue(meta.message)
        if (!queue) return callback({ type: 'text', content: translate('nothingPlaying') });
        try {
            await queue.skip();
            callback({ type: 'react', content: '✅' });

            // wait 1 second to get the next song
            await new Promise(resolve => setTimeout(resolve, 1000));

            // check if there is a song in queue
            if (queue.songs.length === 0) return;

            // get the next song
            const track = queue.songs[0];
            let embed = createEmbed(track, locale, queue);
            callback({ type: 'embed', content: embed });
        } catch (e) {
            console.log(e);
            callback({ type: 'react', content: '❌' });
        }
    }
}