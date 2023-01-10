const { EmbedBuilder } = require('discord.js');
const createEmbed = require('../common/playingEmbed')

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
    aliases: ["np", "нп", "музон"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        if (!translations.hasOwnProperty(locale))
            locale = "en";

        const queue = meta.client.distube.getQueue(meta.message)

        if (!queue) {
            callback({ type: 'text', content: `❌ | ${translations[locale].nothingPlaying}` });
            return;
        }

        const track = queue.songs[0]
        let embed = createEmbed(track, locale, queue);
        callback({ type: 'embed', content: embed });
    }
}