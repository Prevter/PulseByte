const Command = require("../../types/command");
const discord = require("discord.js");

const perPage = 10;

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'queue',
            aliases: ['q', 'list'],
            category: 'music',
            guild_only: true
        });
    }

    secondsToHms(s) {
        var h = Math.floor(s / 3600);
        var m = Math.floor(s % 3600 / 60);
        var s = Math.floor(s % 3600 % 60);

        var hDisplay = h > 0 ? h + ":" : "";
        var mDisplay = m < 10 ? "0" + m + ":" : m + ":";
        var sDisplay = s < 10 ? "0" + s : s;

        return hDisplay + mDisplay + sDisplay;
    }

    getPageCount(queue) {
        return Math.max(Math.ceil((queue.songs.length - 1) / perPage), 1);
    }

    buildQueueEmbed(queue, page, locale) {
        let total_duration = 0;
        for (var i = 0; i < queue.songs.length; i++) {
            total_duration += queue.songs[i].duration;
        }
        total_duration = this.secondsToHms(total_duration);

        const currentSong = queue.songs[0];
        const maxPages = this.getPageCount(queue);
        const songCount = queue.songs.length;
        const start = (page - 1) * perPage + 1;
        const end = page * perPage;

        let description = locale('queue.total_duration', total_duration) + '\n\n';
        description += locale('queue.now_playing') +
            `\n\`${currentSong.formattedDuration}\` - **[${currentSong.name}](${currentSong.url})** - <@${currentSong.user.id}>\n\n`;
        description += locale('queue.queue') + '\n';

        for (var i = start; i <= end; i++) {
            if (i >= songCount) break;
            const song = queue.songs[i];
            description += `${i}. \`${song.formattedDuration}\` - **[${song.name}](${song.url})** - <@${song.user.id}>\n`;
        }
        if (songCount === 1) description += locale('global.none');

        return Command.createEmbed({
            title: locale('queue.title'),
            description,
            footer: { text: locale('queue.page', page, maxPages, songCount) },
        })
    }

    createButtons(page, maxPages) {
        const prev_page = new discord.ButtonBuilder()
            .setCustomId("prev_page")
            .setLabel("⬅️")
            .setStyle(discord.ButtonStyle.Primary)
            .setDisabled(page <= 1);

        const next_page = new discord.ButtonBuilder()
            .setCustomId("next_page")
            .setLabel("➡️")
            .setStyle(discord.ButtonStyle.Primary)
            .setDisabled(page >= maxPages);

        return new discord.ActionRowBuilder()
            .addComponents(prev_page, next_page);
    }

    createButtonCollector(message, author, embed, queue, locale) {
        let page = 1;
        let lastEmbed = embed;
        const collector = message.createMessageComponentCollector({ filter: i => i.user.id === author.id, time: this.config.bot.buttons_timeout });
        collector.on("collect", async i => {
            const maxPages = this.getPageCount(queue);
            if (i.customId === "prev_page") {
                page--;
                lastEmbed = this.buildQueueEmbed(queue, page, locale);
                await i.update({
                    embeds: [lastEmbed],
                    components: [this.createButtons(page, maxPages)]
                });
            } else if (i.customId === "next_page") {
                page++;
                lastEmbed = this.buildQueueEmbed(queue, page, locale);
                await i.update({
                    embeds: [lastEmbed],
                    components: [this.createButtons(page, maxPages)]
                });
            }
        });
        collector.on("end", async (collected, reason) => {
            if (reason === "time") {
                await message.edit({
                    embeds: [lastEmbed],
                    components: []
                });
            }
        });
    }

    async run(message, locale, args) {
        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_voice'))] });

        const queue = this.discord.distube.getQueue(message);
        if (!queue)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_queue'))] });

        const pages = this.getPageCount(queue);
        const embed = this.buildQueueEmbed(queue, 1, locale);
        const msg = await message.reply({
            embeds: [embed],
            components: [this.createButtons(1, pages)]
        });
        this.createButtonCollector(msg, message.member, embed, queue, locale);
    }
}