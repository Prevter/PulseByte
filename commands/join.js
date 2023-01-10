const { joinVoiceChannel } = require('@discordjs/voice');

const translations = {
    en: {
        desc: "Join voice chat",
        args: {},
        mustBeInChannel: "You must be in a voice channel",
    },
    uk: {
        desc: "Підключитись до голосового каналу",
        args: {},
        mustBeInChannel: "Ви повинні бути в голосовому каналі",
    },
};

module.exports = {
    name: "join",
    aliases: ["connect", "зайди", "джоін", "підключись"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        if (!translations.hasOwnProperty(locale))
            locale = "en";

        const voiceChannel = meta.message.member?.voice?.channel;
        if (voiceChannel) {
            meta.client.distube.voices.join(voiceChannel)
        }
        else {
            callback({ type: 'text', content: translations[locale].mustBeInChannel });
        }

    }
}