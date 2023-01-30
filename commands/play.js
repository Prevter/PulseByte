const { EmbedBuilder } = require('discord.js');
const createEmbed = require('../common/playingEmbed')

const translations = {
    en: {
        desc: "Start playing music",
        args: {
            query: "Query to search or URL"
        },
        mustBeInChannel: "You must be in a voice channel",
    },
    uk: {
        desc: "Почати відтворення музики",
        args: {
            query: "Запит для пошуку або URL"
        },
        mustBeInChannel: "Ви повинні бути в голосовому каналі",
    },
};

module.exports = {
    name: "play",
    aliases: ["p", "п", "плей", "запусти", "грай"],
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
        if (!translations.hasOwnProperty(locale))
            locale = "en";

        if (!args.query) {
            callback({ type: 'text', content: translations[locale].args.query });
            return;
        }

        const voiceChannel = meta.message.member?.voice?.channel;
        if (voiceChannel) {
            let options = {
                textChannel: meta.channel,
                member: meta.member
            }

            if (meta.type === 'prefix') options.message = meta.message;
            else options.interaction = meta.message;
            
            try {
                await meta.client.distube.play(voiceChannel, args.query, options);

                const track = await meta.client.player.search(args.query, {
                    requestedBy: meta.member
                }).then(x => x.tracks[0]);
                
                callback({ type: 'react', content: '✅' });

                let embed = createEmbed(track, locale);
    
                if (embed)
                    callback({ type: 'embed', content: embed })
            } catch (err) { 
                console.error(err); 
                callback({ type: 'react', content: '❌' }); 
                callback({ type: 'text', content: '```' + err.message + '```' });
            }
        }
        else {
            callback({ type: 'text', content: translations[locale].mustBeInChannel });
        }

    }
}