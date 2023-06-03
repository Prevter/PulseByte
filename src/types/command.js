const discord = require('discord.js');
const localeBuilder = require('../locale');
const config = require('../../config');

const https = require("https");
const fs = require('fs');
let locales = [];
fs.readdirSync('./src/locales').forEach(file => {
    if (file.endsWith('.json')) {
        locales.push(file.replace('.json', ''));
    }
});

module.exports = class Command {
    /**
     * Creates a new command.
     * @param {DiscordClient} client Discord client
     * @param {DatabaseContext} database Database context
     * @param {object} options Command options
     * @param {string} options.name Command name
     * @param {string} options.category Command category
     * @param {Array<object>} options.args Command arguments
     * @param {Array<string>} options.aliases Command aliases
     * @param {Array<string>} options.permissions Command permissions
     * @param {boolean} options.admin_only Admin only command
     * @param {boolean} options.guild_only Guild only command
     * @param {boolean} options.owner_only Owner only command
     * @param {boolean} options.slash_only Slash command only
     * @param {boolean} options.hidden Hidden command
     */
    constructor(client, database, options) {
        this.client = client;
        this.discord = client.client;
        this.database = database;
        this.name = options.name;
        this.category = options.category;

        this.args = options.args || [];
        this.aliases = options.aliases || [];
        this.permissions = options.permissions || [];
        this.admin_only = options.admin_only || false;
        this.guild_only = options.guild_only || false;
        this.owner_only = options.owner_only || false;
        this.slash_only = options.slash_only || false;
        this.hidden = options.hidden || false;

        this._locales = locales;
        this.config = config;
    }

    /**
     * Generates a slash command info object.
     * @returns {discord.ApplicationCommand}
     */
    buildSlashCommand() {
        // Do not build slash command if the command is owner only or hidden.
        if (this.owner_only || this.hidden)
            return null;

        // Parse description translations.
        let descTranslations = {};
        locales.forEach(l => {
            // Default language is already built in the command.
            if (l === config.default_language) return;

            const locale = localeBuilder(l);
            const desc = locale(`!${this.name}._description`);
            if (desc !== null) {
                descTranslations[l] = desc;
            }
        });

        // Build the command.
        let builder = new discord.SlashCommandBuilder()
            .setName(this.name)
            .setDescription(this.client.locale(`${this.name}._description`) || 'No description provided.')
            .setDescriptionLocalizations(descTranslations)
            .setDMPermission(this.guild_only ? false : true);

        // Parse arguments.
        for (let arg of this.args) {
            let argTranslations = {};
            locales.forEach(l => {
                if (l === config.default_language) return;

                const locale = localeBuilder(l);
                const desc = locale(`!${this.name}._args_desc.${arg.name}`);
                if (desc !== null) {
                    argTranslations[l] = desc;
                }
            });

            const applyOptions = (option) => {
                return option.setName(arg.name)
                    .setDescription(this.client.locale(`${this.name}._args_desc.${arg.name}`) || 'No description provided.')
                    .setDescriptionLocalizations(argTranslations)
                    .setRequired(arg.required || false);
            }

            switch (arg.type) {
                case 'string':
                    builder.addStringOption(applyOptions);
                    break;
                case 'integer':
                    builder.addIntegerOption(applyOptions);
                    break;
                case 'boolean':
                    builder.addBooleanOption(applyOptions);
                    break;
                case 'user':
                    builder.addUserOption(applyOptions);
                    break;
                case 'channel':
                    builder.addChannelOption(applyOptions);
                    break;
                case 'role':
                    builder.addRoleOption(applyOptions);
                    break;
                case 'mentionable':
                    builder.addMentionableOption(applyOptions);
                    break;
                case 'choice':
                    builder.addStringOption(option =>
                        applyOptions(option)
                            .addChoices(...arg.choices)
                    );
                    break;
                default:
                    throw new Error(`Unknown argument type: ${arg.type}`);
            }
        }

        // Parse permissions.
        let flags = null;
        for (let perm of this.permissions) {
            if (flags === null) flags = discord.PermissionFlagsBits[perm];
            else flags |= discord.PermissionFlagsBits[perm];
        }
        if (flags !== null) builder.setDefaultMemberPermissions(flags);

        return builder;
    }

    /**
     * Runs the command as a slash command.
     * @param {discord.CommandInteraction} interaction Discord command interaction
     * @param {(key:string, ...args) => string} locale Locale function
     * @param {Object} args Command arguments
    */
    async runAsSlash(interaction, locale, args) {
        this.run(interaction, locale, args);
    }

    /**
     * Runs the command as a message command.
     * @param {discord.Message} message Discord message
     * @param {(key:string, ...args) => string} locale Locale function
     * @param {string[]} args Command arguments
    */
    async run(message, locale, args) {
        message.reply({ embeds: [Command.createErrorEmbed(locale('global.not_implemented'))] });
        throw new Error('Command not implemented.');
    }

    /**
     * Creates a discord embed for easier embed creation.
     * @param {Object} options
     * @param {string} options.color
     * @param {string} options.title
     * @param {string} options.url
     * @param {string} options.description
     * @param {string} options.author
     * @param {string} options.footer
     * @param {string} options.thumbnail
     * @param {string} options.image
     * @param {Object[]} options.fields
     * @returns {discord.EmbedBuilder}
     * @example
     * const embed = Command.createEmbed({
     *     title: 'Hello world!',
     *     description: 'This is an embed.',
     *     fields: [{
     *         name: 'Field 1',
     *         value: 'This is the first field.'
     *     },
     *     {
     *         name: 'Field 2',
     *         value: 'This is the second field.'
     *     }]
     * });
    */
    static createEmbed(options) {
        let embed = new discord.EmbedBuilder();
        embed.setColor(config.bot.embed_color);

        let creationStep = 'color'; // For error handling.
        try {
            if (options.color) embed.setColor(options.color);
            creationStep = 'title';
            if (options.title) embed.setTitle(options.title);
            creationStep = 'url';
            if (options.url) embed.setURL(options.url);
            creationStep = 'description';
            if (options.description) embed.setDescription(options.description);
            creationStep = 'author';
            if (options.author) embed.setAuthor(options.author);
            creationStep = 'footer';
            if (options.footer) embed.setFooter(options.footer);
            creationStep = 'timestamp';
            if (options.timestamp) embed.setTimestamp();
            creationStep = 'thumbnail';
            if (options.thumbnail) embed.setThumbnail(options.thumbnail);
            creationStep = 'image';
            if (options.image) embed.setImage(options.image);
            if (options.fields) {
                let i = 0;
                for (let field of options.fields) {
                    creationStep = `fields[${i++}]`;
                    embed.addFields(field);
                }
            }
        }
        catch (e) {
            this.client.logger.error(`Failed to create embed on step ${creationStep}. Full embed object: \n${JSON.stringify(options, null, 4)}`);
        }

        return embed;
    }

    /**
     * Macro for creating an error embed with a message and default color.
     * @param {string} message Error message
     * @returns {discord.EmbedBuilder}
    */
    static createErrorEmbed(message) {
        return Command.createEmbed({
            color: config.bot.error_embed_color,
            description: message
        });
    }

    /**
     * Fetches data from an URL and converts to JSON.
     * @param {string} url URL to fetch
     * @param {https.RequestOptions} options Fetch options
     * @returns {Promise<Object>} Result JSON
     */
    static async fetch(url, options = {}) {
        return new Promise((resolve, reject) => {
            https.get(url, options, (res) => {
                let data = '';
                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    resolve(JSON.parse(data));
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * Fetches data from an URL and loads as binary object.
     * @param {string} url URL to fetch
     * @param {https.RequestOptions} options Fetch options
     * @returns {Promise<Buffer>} Result buffer
     */
    static async fetchBinary(url, options = {}) {
        return new Promise((resolve, reject) => {
            https.get(url, options, (res) => {
                let data = [];
                res.on('data', (chunk) => {
                    data.push(chunk);
                });

                res.on('end', () => {
                    resolve(Buffer.concat(data));
                });
            }).on('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * Loads a member from a guild.
     * @param {discord.Guild} guild Discord guild
     * @param {string} member_id Member ID
     * @returns {Promise<discord.GuildMember>} Discord guild member
     */
    static async loadMember(guild, member_id) {
        if (!member_id) return;

        if (member_id.startsWith('<@') && member_id.endsWith('>')) {
            member_id = member_id.slice(2, -1);
            if (member_id.startsWith('!')) {
                member_id = member_id.slice(1);
            }
        }

        return await guild.members.fetch(member_id);
    }

    /**
     * Formats a UTC timestamp to a string with the given format.
     * @param {*} timestamp timestamp
     * @param {*} formatString format string
     * @returns {string} Formatted date
     * @example
     * formatDate(new Date(), 'HH:mm:ss'); // 12:34:56
     * formatDate(new Date(), 'YYYY-MM-DD'); // 2021-01-01
     * formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss'); // 2021-01-01 12:34:56
     */
    static formatDate(timestamp, formatString) {
        const date = new Date(timestamp);
        const format = formatString.replace(/YYYY/g, date.getUTCFullYear())
            .replace(/MM/g, ('0' + (date.getUTCMonth() + 1)).slice(-2))
            .replace(/DD/g, ('0' + date.getUTCDate()).slice(-2))
            .replace(/HH/g, ('0' + date.getUTCHours()).slice(-2))
            .replace(/mm/g, ('0' + date.getUTCMinutes()).slice(-2))
            .replace(/ss/g, ('0' + date.getUTCSeconds()).slice(-2));
        return format;
    }
};