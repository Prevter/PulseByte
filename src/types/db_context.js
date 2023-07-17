const notImplemented = () => { throw new Error('Method not implemented.'); };

module.exports = class DatabaseContext {
    /**
     * Creates a new database context instance
     * @param {string} connection_string 
     * @param {Logger} logger 
     */
    constructor(connection_string, logger) {
        this.connection_string = connection_string;
        this.logger = logger;
        this.init();
    }

    /**
     * Initializes the database context
     */
    init() { }
    /**
     * Closes the database context
     */
    close() { }

    /**
     * Exports each table
     */
    async export() {
        const guilds = await this.getGuilds();
        let users = [];
        let custom_commands = [];
        for (const guild of guilds) {
            const guild_users = await this.getUsers(guild.id);
            const guild_commands = await this.getCustomCommands(guild.id);
            users = users.concat(guild_users);
            custom_commands = custom_commands.concat(guild_commands);
        }
        const profiles = await this.getProfiles();
        const stats = await this.getStats();

        return {
            guilds,
            users,
            profiles,
            custom_commands,
            stats,
        };
    }

    // `guild` table contains settings for each guild (prefix, language, etc.)
    /**
     * Gets all guilds
     * @returns {Promise<Array<Guild>>} Array of guilds
     */
    async getGuilds() { notImplemented(); }
    /**
     * Gets a guild by its ID
     * @param {string} guild_id 
     * @returns {Promise<Guild>} Guild
     */
    async getGuild(guild_id) { notImplemented(); }
    /**
     * Creates a new entry for a guild
     * @param {string} guild_id
     * @returns {Promise<Guild>} Created guild
     */
    async createGuild(guild_id) { notImplemented(); }
    /**
     * Updates a guild
     * @param {Guild} guild 
     * @returns {Promise<void>}
     */
    async updateGuild(guild) { notImplemented(); }
    /**
     * Deletes a guild
     * @param {string} guild_id
     * @returns {Promise<void>}
     */
    async deleteGuild(guild_id) { notImplemented(); }

    // `users` table contains statistics for each user for each guild (xp, messages sent)
    /**
     * Gets all users for a guild
     * @param {string} guild_id 
     * @returns {Promise<Array<User>>} Array of users
     */
    async getUsers(guild_id) { notImplemented(); }
    /**
     * Gets a user by its ID and guild ID
     * @param {string} user_id 
     * @param {string} guild_id 
     * @returns {Promise<User>} User
     */
    async getUser(user_id, guild_id) { notImplemented(); }
    /**
     * Creates a new entry for a user
     * @param {User} user 
     * @returns {Promise<void>}
     */
    async createUser(user) { notImplemented(); }
    /**
     * Updates a user
     * @param {User} user 
     * @returns {Promise<void>}
     */
    async updateUser(user) { notImplemented(); }
    /**
     * Deletes a user
     * @param {string} user_id 
     * @param {string} guild_id 
     * @returns {Promise<void>}
     */
    async deleteUser(user_id, guild_id) { notImplemented(); }

    // `profiles` table is used for profile cards settings
    /**
     * Gets all profiles
     * @returns {Promise<Array<Profile>>} Array of profiles
     */
    async getProfiles() { notImplemented(); }
    /**
     * Gets a profile by its ID
     * @param {string} user_id 
     * @returns {Promise<Profile>} Profile
     */
    async getProfile(user_id) { notImplemented(); }
    /**
     * Creates a new entry for a profile
     * @param {Profile} profile 
     * @returns {Promise<void>}
     */
    async createProfile(profile) { notImplemented(); }
    /**
     * Updates a profile
     * @param {Profile} profile 
     * @returns {Promise<void>}
     */
    async updateProfile(profile) { notImplemented(); }
    /**
     * Deletes a profile
     * @param {string} user_id 
     * @returns {Promise<void>}
     */
    async deleteProfile(user_id) { notImplemented(); }

    // `custom_commands` table is used for custom commands
    /**
     * Gets all custom commands for a guild
     * @param {string} guild_id
     * @returns {Promise<Array<CustomCommand>>} Array of custom commands
     */
    async getCustomCommands(guild_id) { notImplemented(); }
    /**
     * Gets a custom command by its name and guild ID
     * @param {string} guild_id 
     * @param {string} command_name
     * @returns {Promise<CustomCommand>} Custom command
     */
    async getCustomCommand(guild_id, command_name) { notImplemented(); }
    /**
     * Creates a new entry for a custom command
     * @param {CustomCommand} command
     * @returns {Promise<void>}
     */
    async createCustomCommand(command) { notImplemented(); }
    /**
     * Updates a custom command
     * @param {CustomCommand} command
     * @returns {Promise<void>}
     */
    async updateCustomCommand(command) { notImplemented(); }
    /**
     * Deletes a custom command
     * @param {string} guild_id
     * @param {string} command_name
     */
    async deleteCustomCommand(guild_id, command_name) { notImplemented(); }

    // 'stats' table is used for storing statistics about the bot
    /**
     * Gets statistics
     * @returns {Promise<Stats>} Statistics
     */
    async getStats() { notImplemented(); }
    /**
     * Updates statistics
     * @param {Stats} stats
     * @returns {Promise<void>}
     */
    async updateStats(stats) { notImplemented(); }
    /**
     * Increments the number of messages sent
     * @returns {Promise<void>}
     */
    async incrementSlashCommandUsage() { notImplemented(); }
    /**
     * Increments the number of messages sent
     * @returns {Promise<void>}
     */
    async incrementCommandUsage() { notImplemented(); }
}

// Types for database tables (for IDEs):

/**
 * @typedef {object} Guild
 * @property {string} id Guild ID
 * @property {string} prefix Command prefix
 * @property {string} language Language code
 * @property {int} xp_enabled Whether XP is enabled (0 or 1)
 * @property {int} automod_enabled Whether automod is enabled (0 or 1)
 * @property {string} welcome_channel Welcome channel ID (can be empty)
 * @property {string} welcome_msg Welcome message (default if empty)
 * @property {string} log_channel Channel ID for logging (can be empty)
 */

/**
 * @typedef {object} User
 * @property {string} id User ID
 * @property {string} guild_id Guild ID
 * @property {int} xp XP amount
 * @property {int} message_count Messages sent
 * @property {int} last_message Timestamp of last message sent
 */

/**
 * @typedef {object} Profile
 * @property {string} id User ID
 * @property {string} card_color Color of the foreground of the profile card
 * @property {string} card_background Color of the background of the profile card
 * @property {int} card_opacity Opacity of the profile card (0-100)
 */

/**
 * @typedef {object} CustomCommand
 * @property {string} guild_id Guild ID
 * @property {string} name Command name
 * @property {boolean} use_prefix Whether to use the guild prefix
 * @property {string} mode Command mode (normal, startWith, endsWith, contains, regex)
 * @property {string} code Command code
 */

/**
 * @typedef {object} Stats
 * @property {int} commands_executed Amount of commands executed
 * @property {int} slash_commands Amount of slash commands executed
 */