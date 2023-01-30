const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Stop playing music",
        args: {},
        mustBeInChannel: "You must be in a voice channel",
    },
    uk: {
        desc: "Зупинити відтворення музики",
        args: {},
        mustBeInChannel: "Ви повинні бути в голосовому каналі",
    },
};

module.exports = {
    name: "stop",
    aliases: ["стоп", "зупинись"],
    arguments: [],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        const voiceChannel = meta.message.member?.voice?.channel;
        if (voiceChannel) {
            const queue = meta.client.distube.getQueue(meta.message);
            if (!queue) return callback({ type: 'react', content: '❌' });
            queue.stop();
            callback({ type: 'react', content: '✅' });
        }
        else {
            callback({ type: 'text', content: translate('mustBeInChannel') });
        }

    }
}