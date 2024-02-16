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
        this.logger.info('Discord', '🤖 Connecting...');

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
            if (song.metadata) {
                song.metadata.radio_player.start();
            }
            const guildId = queue.textChannel.guild.id;
            const guild = await this.database.getGuild(guildId);
            const language = guild ? guild.language : config.default_language;
            const locale = localeBuilder(language);
            const embed = require('./commands/music/nowplaying')
                .autoEmbed(locale, song, queue, false);
            if (!embed) return;

            if (queue.message) {
                const message = await queue.textChannel.messages.fetch(queue.message.id).catch(() => null);
                if (message) try {
                    await message.delete();
                } catch (err) { /* Ignore */ }
            }

            queue.message = await queue.textChannel.send({ embeds: [embed] });
        });

        this.client.distube.on("finishSong", async (queue, song) => {
            if (song.metadata && song.metadata.radio_player) {
                song.metadata.radio_player.stop();
            }
            if (queue.message) {
                const message = await queue.textChannel.messages.fetch(queue.message.id).catch(() => null);
                if (message) await message.delete();
                queue.message = null;
            }
        });

        this.client.distube.on("searchNoResult", async (message, query) => {
            console.warn(`[DISTUBE] No results found for query: ${query}`);
        });

        this.loadHandlers();
        this.reloadCommands();
    }

    reloadCommands() {
        this.commands = [];
        this.modules = [];

        const loadCommand = (filePath) => {
            try {
                const path = filePath.replace('.js', '');
                if (require.cache[require.resolve(path)]) {
                    delete require.cache[require.resolve(path)];
                }
                const command = require(path);
                const instance = new command(this, this.database);
                this.commands.push(instance);
            }
            catch (err) {
                this.logger.error('Commands', `⚠️ Failed to load command '${filePath}': ${err.stack}`);
            }
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
            if (require.cache[require.resolve(path)]) {
                delete require.cache[require.resolve(path)];
            }
            const module = require(path);
            this.modules.push(new module(this, this.database));
        });
    }

    loadHandlers() {
        // Clear all the handlers
        this.client.removeAllListeners();

        // Load all the handlers from 'src/handlers'
        fs.readdirSync('./src/handlers', { withFileTypes: true }).forEach(file => {
            // Clear the cache for the file if it's already loaded
            const path = `./handlers/${file.name}`;
            if (require.cache[require.resolve(path)]) {
                delete require.cache[require.resolve(path)];
            }

            // Load the handler
            const handler = require(path);
            if (handler.once) {
                this.client.once(handler.name, (...args) => handler.execute(this, ...args));
            }
            else {
                this.client.on(handler.name, (...args) => handler.execute(this, ...args));
            }
        });
    }

    /**
     * Registers all the commands on the Discord API.
     * This should be called after the client is logged in.
     */
    async registerCommands() {
        const cmds = [];
        for (const cmd of this.commands) {
            const slashCommandData = cmd.buildSlashCommand();
            if (slashCommandData)
                cmds.push(slashCommandData.toJSON());
        }

        const rest = new discord.REST({ version: '10' }).setToken(this.token);
        try {
            this.logger.info('Discord', `🔄️ Started refreshing ${cmds.length} commands.`);
            const data = await rest.put(
                discord.Routes.applicationCommands(this.client.user.id),
                { body: cmds },
            );
            for (const cmd of data) {
                const command = this.commands.find(c => c.name === cmd.name);
                command._id = cmd.id;
            }
            this.logger.info('Discord', `✅ Successfully reloaded ${data.length} commands.`);
        } catch (error) {
            this.logger.error('Discord', error);
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