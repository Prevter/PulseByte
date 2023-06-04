const Command = require("../../types/command");
const XPModule = require("../../modules/xp");
const discord = require('discord.js');

const perPage = 5;

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'leaderboard',
            aliases: ['lb', 'top'],
            category: 'levels',
            guild_only: true
        });
    }

    nFormatter(num, digits) {
        const lookup = [
            { value: 1, symbol: "" },
            { value: 1e3, symbol: "k" },
            { value: 1e6, symbol: "M" },
            { value: 1e9, symbol: "G" },
            { value: 1e12, symbol: "T" },
            { value: 1e15, symbol: "P" },
            { value: 1e18, symbol: "E" }
        ];
        const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
        var item = lookup.slice().reverse().find(function (item) {
            return num >= item.value;
        });
        return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
    }

    buildLeaderboardEmbed(guild_id, ratings, page, locale) {
        const maxPages = this.getPageCount(ratings);
        const start = (page - 1) * perPage;
        const end = page * perPage;

        let description = locale('leaderboard.description', this.config.web.url, guild_id) + '\n\n';
        ratings.slice(start, end).map((rating, index) => {
            return {
                name: `${index + start + 1}. <@${rating.id}>`,
                value: locale(
                    'leaderboard.xp_level_messages',
                    this.nFormatter(rating.xp, 2),
                    rating.level,
                    rating.messages
                )
            }
        }).forEach(field => description += `${field.name}\n${field.value}\n\n`)

        return Command.createEmbed({
            title: locale('leaderboard.title'),
            description,
            footer: { text: locale('leaderboard.page', page, maxPages, ratings.length) }
        });
    }

    getPageCount(ratings) {
        return Math.max(Math.ceil(ratings.length / perPage), 1);
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

    createButtonCollector(message, author, guild_id, ratings, embed, locale) {
        let page = 1;
        let lastEmbed = embed;
        const collector = message.createMessageComponentCollector({ filter: i => i.user.id === author.id, time: this.config.bot.buttons_timeout });
        collector.on("collect", async i => {
            const maxPages = this.getPageCount(ratings);
            if (i.customId === "prev_page") {
                page--;
                lastEmbed = this.buildLeaderboardEmbed(guild_id, ratings, page, locale);
                await i.update({
                    embeds: [lastEmbed],
                    components: [this.createButtons(page, maxPages)]
                });
            } else if (i.customId === "next_page") {
                page++;
                lastEmbed = this.buildLeaderboardEmbed(guild_id, ratings, page, locale);
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
        if (!message.guild_data.xp_enabled)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('rank.xp_disabled'))] });

        const users = await this.database.getUsers(message.guild.id);
        let place = 1;
        const userLevels = users.map(u => ({
            id: u.id,
            place: place++,
            xp: u.xp,
            level: XPModule.getLevel(u.xp),
            messages: u.message_count
        }));

        const embed = this.buildLeaderboardEmbed(message.guild.id, userLevels, 1, locale);
        const buttons = this.createButtons(1, this.getPageCount(userLevels));
        const msg = await message.reply({ embeds: [embed], components: [buttons] });
        this.createButtonCollector(msg, message.member, message.guild.id, userLevels, embed, locale);
    }
}