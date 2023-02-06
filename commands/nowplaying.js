const createEmbed = require('../common/playingEmbed')
const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Get current playing song",
        args: {},
        mustBeInChannel: "You must be in a voice channel",
        nothingPlaying: "There aren't any music playing right now"
    },
    uk: {
        desc: "Дізнатись яка музика зараз грає",
        args: {},
        mustBeInChannel: "Ви повинні бути в голосовому каналі",
        nothingPlaying: "Наразі музика не грає"
    },
};

module.exports = {
    name: "nowplaying",
    category: "music",
    aliases: ["np", "нп", "музон"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        const queue = meta.client.distube.getQueue(meta.message)

        if (!queue) {
            callback({ type: 'text', content: `❌ | ${translate('nothingPlaying')}` });
            return;
        }

        const track = queue.songs[0]
        let embed = createEmbed(track, locale, queue, true);

        if (embed)
            callback({ type: 'embed', content: embed });
    }
}