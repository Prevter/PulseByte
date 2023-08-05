const Command = require("../../types/command");
const { RadioPlayerURL } = require("@prevter/tavr-media-radio");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'nowplaying',
            aliases: ['np', 'current', 'currentsong'],
            category: 'music',
            guild_only: true
        });
    }

    static autoEmbed(locale, song, queue, showProgress) {
        if (song.radio_player) {
            return module.exports.createRadioEmbed(locale, song.radio_player, song);
        }

        return module.exports.createEmbed(locale, song, queue, showProgress);
    }

    static createEmbed(locale, song, queue, showProgress) {
        const embed = {};

        if (song.title || song.name)
            embed.title = song.title ?? song.name;

        if (song.author || (song.uploader && song.uploader.name))
            embed.author = { name: song.author ?? song.uploader.name };

        if (song.thumbnail)
            embed.thumbnail = song.thumbnail;

        if (song.url)
            embed.url = song.url;

        if (song.source) {
            switch (song.source) {
                case 'youtube':
                    embed.footer = { text: 'YouTube' };
                    break;
                case 'soundcloud':
                    embed.footer = { text: 'SoundCloud' };
                    break;
                case 'bandcamp':
                    embed.footer = { text: 'Bandcamp' };
                    break;
                case 'twitch':
                    embed.footer = { text: 'Twitch' };
                    break;
                case 'vimeo':
                    embed.footer = { text: 'Vimeo' };
                    break;
                case 'telegram:embed':
                    embed.footer = { text: 'Telegram' };
                    break;
                case 'generic':
                    embed.footer = { text: 'External' };
                    // check if it's a radio and if it is, do not send the embed
                    if (Object.values(RadioPlayerURL).includes(song.streamURL.replace('_HD', ''))) {
                        return null;
                    }
                    break;
                default:
                    embed.footer = { text: song.source };
                    break;
            }
        }

        if (showProgress && queue?.formattedCurrentTime && song.duration) {
            let progress = queue.currentTime / song.duration;
            progress = Math.round(progress * 10);
            let bar = '';
            for (var i = 0; i < 10; i++) {
                if (i == progress) bar += '🔘';
                else bar += '▬';
            }
            embed.description = `${queue.formattedCurrentTime}${bar}${song.formattedDuration}`;
        }

        let fields = [];
        if (song.formattedDuration || song.duration)
            fields.push({
                name: locale('nowplaying.duration'),
                value: `${song.formattedDuration ?? song.duration}`,
                inline: true
            });

        if (song.views)
            fields.push({
                name: locale('nowplaying.views'),
                value: `${song.views}`,
                inline: true
            });

        if (song.user)
            fields.push({
                name: locale('nowplaying.requested_by'),
                value: `${song.user.username}`
            });

        embed.fields = fields;
        return Command.createEmbed(embed);
    }

    static createRadioEmbed(locale, player, song) {
        if (!player.currentSong)
            return;

        const fields = [{
            name: locale('radio.started'),
            value: player.currentSong.start_time_full,
            inline: true
        }];

        if (player.currentDJ) {
            fields.push({
                name: locale('radio.dj'),
                value: player.currentDJ.title,
                inline: true
            });
        }

        fields.push({
            name: locale('nowplaying.requested_by'),
            value: `${song.user.username}`
        });

        const embed = {
            author: { name: player.currentSong.singer },
            title: player.currentSong.song,
            description: locale('radio.description', player.station_name),
            fields,
            thumbnail: player.currentSong.image,
            url: player.currentSong.url ?? undefined,
            footer: { text: player.station_name }
        };

        return Command.createEmbed(embed);
    }

    async run(message, locale, args) {
        const queue = this.discord.distube.getQueue(message);
        if (!queue)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_queue'))] });

        const song = queue.songs[0];

        if (song.metadata?.radio_player) {
            // return if radio hasn't initialized yet
            if (!song.metadata.radio_player.currentSong) return null;

            const embed = module.exports.createRadioEmbed(locale, song.metadata.radio_player, song);
            await message.reply({ embeds: [embed] });
            return;
        }

        const embed = module.exports.createEmbed(locale, song, queue, true);
        await message.reply({ embeds: [embed] });
    }
}