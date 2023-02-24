const createEmbed = require('../common/playingEmbed')
const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Play music and skip current song",
        args: {
            query: "Query to search or URL"
        },
        mustBeInChannel: "You must be in a voice channel",
        noQuery: "You didn't specify query to search or URL"
    },
    uk: {
        desc: "Почати відтворення музики та пропустити поточну пісню",
        args: {
            query: "Запит для пошуку або URL"
        },
        mustBeInChannel: "Ви повинні бути в голосовому каналі",
        noQuery: "Ви не вказали запит для пошуку або URL"
    },
};

module.exports = {
    name: "playskip",
    category: "music",
    aliases: ["skipplay", "ps", "пс", "плейскіп", "скіпплей"],
    arguments: [
        {
            name: "query",
            type: "string",
            isRequired: true,
            longString: true,
            useQuotes: false,
        }
    ],
    translations: translations,
    guildOnly: true,
    run: async (args, db, locale, callback, meta) => {
        let translate = new Translator(translations, locale);

        if (!args.query) {
            callback({ type: 'text', content: translate('noQuery') });
            return;
        }

        const voiceChannel = meta.message.member?.voice?.channel;
        if (voiceChannel) {
            let options = {
                textChannel: meta.channel,
                member: meta.member,
                skip: true
            }

            if (meta.type === 'prefix') options.message = meta.message;
            else options.interaction = meta.message;

            try {
                await meta.client.distube.play(voiceChannel, args.query, options);
                callback({ type: 'react', content: '✅' });
            } catch (err) {
                console.error(err);
                callback({ type: 'react', content: '❌' });
                callback({ type: 'text', content: '```' + err.message + '```' });
            }
        }
        else {
            callback({ type: 'text', content: translate('mustBeInChannel') });
        }

    }
}