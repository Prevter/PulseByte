const translations = {
    en: {
        desc: "Leave voice chat",
        args: {}
    },
    uk: {
        desc: "Відключитись від голосового каналу",
        args: {}
    },
};

module.exports = {
    name: "leave",
    category: "music",
    aliases: ["disconnect", "вийди", "дісконект", "геть"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        meta.client.distube.voices.leave(meta.message)
    }
}