const voice = require('@discordjs/voice');

const translations = {
    en: {
        desc: "Leave voice chat",
        args: {},
        notInChannel: "I'm not in any voice channel",
    },
    uk: {
        desc: "Відключитись від голосового каналу",
        args: {},
        notInChannel: "Мене немає в жодному голосовому каналі",
    },
};

module.exports = {
    name: "leave",
    aliases: ["disconnect", "вийди", "дісконект", "геть"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        if (!translations.hasOwnProperty(locale))
            locale = "en";

        meta.client.distube.voices.leave(meta.message)
    }
}