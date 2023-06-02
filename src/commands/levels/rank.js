const Command = require("../../types/command");
const XPModule = require("../../modules/xp");
const { AttachmentBuilder } = require('discord.js');
const { join } = require('path');
const { createCanvas, GlobalFonts, loadImage } = require('@napi-rs/canvas')
GlobalFonts.registerFromPath(join(__dirname, '../../assets/OpenSans.ttf'), 'Open Sans');

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'rank',
            aliases: ['xp', 'level', 'lvl'],
            category: 'levels',
            args: [{
                name: 'member',
                type: 'user',
            }],
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

    /**
     * Returns attachment with image of user level
     * @param {(key:string, ...args) => string} locale Locale function
     * @param {Object} user_data User to create image for
     * @param {(Message|Interaction)} message Message to reply
     */
    async createImage(locale, user_data) {
        const canvas = createCanvas(934, 282);
        const ctx = canvas.getContext('2d');

        const text = (text, x, y, maxWidth, fontSize, color = '#000000', align = 'left') => {
            ctx.save();
            ctx.font = `${fontSize}px e-Ukraine`;
            ctx.fillStyle = color;
            ctx.textAlign = align;
            ctx.textBaseline = 'top';
            ctx.fillText(text, x, y, maxWidth);
            ctx.restore();
        }

        const calculateTextWidth = (text, fontSize) => {
            ctx.save();
            ctx.font = `${fontSize}px e-Ukraine`;
            const width = ctx.measureText(text).width;
            ctx.restore();
            return width;
        }

        const drawAvatar = (avatar, x, y, width, height) => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.clip();
            ctx.drawImage(avatar, x, y, width, height);
            ctx.restore();
        };

        const drawProgressBar = (current, max, x, y, width, height, color) => {
            ctx.save();

            // draw background
            ctx.fillStyle = '#484b4e';
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, 20);
            ctx.fill();

            // create clipping mask for progress
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, 20);
            ctx.clip();

            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.roundRect(x, y, width * (current / max), height, 20);
            ctx.fill();
            ctx.restore();
        };

        ctx.save();
        ctx.fillStyle = '#23272a';
        ctx.rect(0, 0, canvas.width, canvas.height);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.fillStyle = user_data.profile.card_background;
        ctx.globalAlpha = user_data.profile.card_opacity / 100.0;
        ctx.beginPath();
        ctx.roundRect(24, 36, canvas.width - 48, canvas.height - 72, 16);
        ctx.fill();
        ctx.restore();

        // Avatar and username
        const avatar_body = await this.fetchBinary(user_data.avatar);
        const avatar = await loadImage(avatar_body);
        drawAvatar(avatar, 40, 60, 160, 160);
        text(user_data.username, 260, 140, 330, 32, '#ffffff', 'left');
        text('#' + user_data.discriminator, 260 + calculateTextWidth(user_data.username, 32) + 5, 146, 100, 24, '#aaaaaa', 'left');

        // XP
        const level = XPModule.getLevel(user_data.xp);
        const xpToPrevLevel = XPModule.getLevelXp(level);
        const xpToNextLevel = XPModule.getLevelXp(level + 1);
        const xpInLevel = user_data.xp - xpToPrevLevel;
        const xpForLevel = xpToNextLevel - xpToPrevLevel;

        const next_level = ` / ${this.nFormatter(xpToNextLevel, 2)} XP`;
        text(next_level, 880, 146, 150, 24, '#aaaaaa', 'right');
        const next_level_width = calculateTextWidth(next_level, 24);
        text(`${this.nFormatter(user_data.xp, 2)}`, 880 - next_level_width, 146, 150, 24, '#ffffff', 'right');

        // Level and place
        text(`${level}`, 880, 56, 100, 54, user_data.profile.card_color, 'right');
        const level_width = calculateTextWidth(`${level}`, 54);
        const level_text = locale('rank.level')
        text(level_text, 880 - level_width - 8, 82, 100, 24, user_data.profile.card_color, 'right');
        const level_text_width = calculateTextWidth(level_text, 24);
        const place_x = 880 - level_width - 8 - level_text_width - 8;
        const place_text = `#${user_data.place}`;
        const place_width = calculateTextWidth(place_text, 54);
        text(place_text, place_x, 56, 100, 54, '#fff', 'right');
        text(locale('rank.rank'), place_x - 8 - place_width, 82, 100, 24, '#fff', 'right');

        // Progress bar 
        drawProgressBar(xpInLevel, xpForLevel, 242, 182, 650, 40, user_data.profile.card_color);

        const attachment = new AttachmentBuilder(await canvas.encode('png'), { name: 'stats.png' });
        return attachment;
    }

    async getProfile(user_data, guild_id) {
        const ranks = await this.database.getUsers(guild_id);
        const place = ranks.findIndex(u => u.id === user_data.id) + 1;
        user_data.place = place;

        // load profile or create new one
        const profile = await this.database.getProfile(user_data.id);
        if (profile) {
            user_data.profile = profile;
        } else {
            user_data.profile = {
                id: user_data.id,
                card_color: this.config.bot.xp.card.accent_color,
                card_background: this.config.bot.xp.card.background,
                card_opacity: this.config.bot.xp.card.background_opacity,
            };
            await this.database.createProfile(user_data.profile);
        }

        return user_data;
    }

    async loadMember(guild, member_id) {
        if (!member_id) return;

        if (member_id.startsWith('<@') && member_id.endsWith('>')) {
            member_id = member_id.slice(2, -1);
            if (member_id.startsWith('!')) {
                member_id = member_id.slice(1);
            }
        }

        return await guild.members.fetch(member_id);
    }

    async runAsSlash(interaction, locale, args) {
        if (!interaction.guild_data.xp_enabled)
            return await interaction.reply({ embeds: [this.createErrorEmbed(locale('rank.xp_disabled'))] });

        if (!interaction.user_data)
            return await interaction.reply({ embeds: [this.createErrorEmbed(locale('rank.user_not_found'))] });

        await interaction.deferReply();

        let user_data;
        if (args.member) {
            const member = await this.loadMember(interaction.guild, args.member);
            const data = await this.database.getUser(member.id, interaction.guild.id);
            if (!data)
                return await interaction.editReply({ embeds: [this.createErrorEmbed(locale('rank.user_not_found'))] });

            user_data = await this.getProfile(data, interaction.guild.id);
            user_data.avatar = member.displayAvatarURL({ format: 'png', size: 256 });
            user_data.username = member.user.username;
            user_data.discriminator = member.user.discriminator;
        }
        else {
            user_data = await this.getProfile(interaction.user_data, interaction.guild.id);
            user_data.avatar = interaction.user.displayAvatarURL({ format: 'png', size: 256 });
            user_data.username = interaction.user.username;
            user_data.discriminator = interaction.user.discriminator;
        }

        const attachment = await this.createImage(locale, user_data);
        await interaction.editReply({ files: [attachment] });
    }

    async run(message, locale, args) {
        if (!message.guild_data.xp_enabled)
            return await message.reply({ embeds: [this.createErrorEmbed(locale('rank.xp_disabled'))] });

        if (!message.user_data)
            return await message.reply({ embeds: [this.createErrorEmbed(locale('rank.user_not_found'))] });

        let user_data;
        if (args.length > 0) {
            const member = await this.loadMember(message.guild, args[0]);
            const data = await this.database.getUser(member.id, message.guild.id);
            if (!data)
                return await message.reply({ embeds: [this.createErrorEmbed(locale('rank.user_not_found'))] });

            user_data = await this.getProfile(data, message.guild.id);
            user_data.avatar = member.displayAvatarURL({ format: 'png', size: 256 });
            user_data.username = member.user.username;
            user_data.discriminator = member.user.discriminator;
        }
        else {
            user_data = await this.getProfile(message.user_data, message.guild.id);
            user_data.avatar = message.author.displayAvatarURL({ format: 'png', size: 256 });
            user_data.username = message.author.username;
            user_data.discriminator = message.author.discriminator;
        }

        const attachment = await this.createImage(locale, user_data);
        await message.reply({ files: [attachment] });
    }
}