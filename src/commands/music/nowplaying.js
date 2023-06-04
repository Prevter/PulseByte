const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'nowplaying',
            aliases: ['np', 'current', 'currentsong'],
            category: 'music',
            guild_only: true
        });
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

    async run(message, locale, args) {
        const queue = this.discord.distube.getQueue(message);
        if (!queue)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_queue'))] });

        const song = queue.songs[0];
        const embed = module.exports.createEmbed(locale, song, queue, true);
        await message.channel.send({ embeds: [embed] });
    }
}