const createEmbed = require('../common/playingEmbed')
const { Translator } = require('../common/utils');

const translations = {
    en: {
        desc: "Add song to the top of the queue",
        args: {
            query: "Query to search or URL"
        },
        mustBeInChannel: "You must be in a voice channel",
        noQuery: "You didn't specify query to search or URL",
        found: "Found `{0}` by `{1}` ({2})"
    },
    uk: {
        desc: "Додати пісню на початок черги",
        args: {
            query: "Запит для пошуку або URL"
        },
        mustBeInChannel: "Ви повинні бути в голосовому каналі",
        noQuery: "Ви не вказали запит для пошуку або URL",
        found: "Знайдено `{0}` виконавця `{1}` ({2})"
    },
};

module.exports = {
    name: "playnow",
    category: "music",
    aliases: ["pn", "пн", "плейнау", "запустизараз", "гратизараз"],
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
                position: 1
            }

            if (meta.type === 'prefix') options.message = meta.message;
            else options.interaction = meta.message;

            try {
                await meta.client.distube.play(voiceChannel, args.query, options);

                const songs = await meta.client.distube.getQueue(meta.message).songs;
                const track = songs[songs.length - 1];
                const isCurrent = songs.length === 1;
                
                callback({ type: 'react', content: '✅' });

                if (!args.query.startsWith('http') && !isCurrent) {
                    const name = track.name ?? "Unknown";
                    const author = track.uploader.name ?? "Unknown";
                    const duration = track.formattedDuration ?? "Unknown";
                    callback({ type: 'text', content: translate('found', name, author, duration) });
                }

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