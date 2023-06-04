const discord = require('discord.js');
const { DisTube } = require('distube');
const { SpotifyPlugin } = require('@distube/spotify');
const { SoundCloudPlugin } = require('@distube/soundcloud');
const { YtDlpPlugin } = require('@distube/yt-dlp')

const config = require('../config');
const localeBuilder = require('./locale');

const fs = require('fs');

module.exports = class DiscordClient {
    /**
     * Creates a new Discord client
     * @param {string} token Discord bot token
     * @param {DatabaseContext} database Database context
     * @param {Logger} logger Main logger
     */
    constructor(token, database, logger) {
        this.client = null;
        this.database = database;
        this.token = token;
        this.logger = logger;
        this.locale = localeBuilder(config.default_language);
        this.commands = [];
        this.modules = [];
    }

    /**
     * Starts the client and loads all the commands and modules
     */
    init() {
        this.logger.info('🤖 Connecting to Discord...');

        this.client = new discord.Client({
            intents: [
                discord.GatewayIntentBits.DirectMessages,
                discord.GatewayIntentBits.Guilds,
                discord.GatewayIntentBits.GuildModeration,
                discord.GatewayIntentBits.GuildMessages,
                discord.GatewayIntentBits.MessageContent,
                discord.GatewayIntentBits.GuildVoiceStates,
                discord.GatewayIntentBits.GuildMessageReactions,
                discord.GatewayIntentBits.GuildMessageTyping,
                discord.GatewayIntentBits.GuildMembers,
                discord.GatewayIntentBits.GuildPresences,
            ]
        });

        this.client.distube = new DisTube(this.client, {
            leaveOnStop: false,
            leaveOnFinish: false,
            emitAddSongWhenCreatingQueue: false,
            emitAddListWhenCreatingQueue: false,
            plugins: [
                new SpotifyPlugin({
                    emitEventsAfterFetching: true
                }),
                new SoundCloudPlugin(),
                new YtDlpPlugin({ update: true })
            ]
        });

        this.client.distube.on("playSong", async (queue, song) => {
            const guildId = queue.textChannel.guild.id;
            const guild = await this.database.getGuild(guildId);
            const language = guild ? guild.language : config.default_language;
            const locale = localeBuilder(language);
            const embed = require('./commands/music/nowplaying')
                .createEmbed(locale, song, queue, false);
            queue.message = await queue.textChannel.send({ embeds: [embed] });
        });
        
        this.client.distube.on("finishSong", async (queue, song) => {
            if (queue.message) {
                await queue.message.delete();
                queue.message = null;
            }
        });

        this.client.distube.on("searchNoResult", async (message, query) => {
            console.warn(`No results found for query: ${query}`);
        });

        const loadCommand = (filePath) => {
            const path = filePath.replace('.js', '');
            const command = require(path);
            const instance = new command(this, this.database);
            this.commands.push(instance);
        }

        fs.readdirSync('./src/commands', { withFileTypes: true }).forEach(file => {
            if (file.isDirectory()) {
                const category = file.name;
                fs.readdirSync(`./src/commands/${category}`).forEach(file => {
                    loadCommand(`./commands/${category}/${file}`);
                });
            }
            else {
                loadCommand(`./commands/${file.name}`);
            }
        });

        fs.readdirSync('./src/modules', { withFileTypes: true }).forEach(file => {
            const path = `./modules/${file.name}`;
            const module = require(path);
            this.modules.push(new module(this, this.database));
        });
    }

    /**
     * Registers all the commands on the Discord API.
     * This should be called after the client is logged in.
     */
    async registerCommands() {
        const cmds = [];
        for (const cmd of this.commands) {
            cmds.push(cmd.buildSlashCommand().toJSON());
        }

        const rest = new discord.REST({ version: '10' }).setToken(this.token);
        try {
            this.logger.info(`🔄️ Started refreshing ${cmds.length} commands.`);
            const data = await rest.put(
                discord.Routes.applicationCommands(this.client.user.id),
                { body: cmds },
            );
            for (const cmd of data) {
                const command = this.commands.find(c => c.name === cmd.name);
                command._id = cmd.id;
            }
            this.logger.info(`✅ Successfully reloaded ${data.length} commands.`);
        } catch (error) {
            this.logger.error(error);
        }
    }

    once(event, callback) {
        this.client.once(event, callback);
    }

    on(event, callback) {
        this.client.on(event, callback);
    }

    /**
     * Logs the bot in using the token provided in the constructor.
     */
    login() {
        this.client.login(this.token);
    }
}