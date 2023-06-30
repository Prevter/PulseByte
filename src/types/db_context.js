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
    async getGuilds() { notImplemented(); }
    async getGuild(guild_id) { notImplemented(); }
    async createGuild(guild) { notImplemented(); }
    async updateGuild(guild) { notImplemented(); }
    async deleteGuild(guild_id) { notImplemented(); }

    // `users` table contains statistics for each user for each guild (xp, messages sent)
    async getUsers(guild_id) { notImplemented(); }
    async getUser(user_id, guild_id) { notImplemented(); }
    async createUser(user) { notImplemented(); }
    async updateUser(user) { notImplemented(); }
    async deleteUser(user_id, guild_id) { notImplemented(); }

    // `profiles` table is used for profile cards settings
    async getProfiles() { notImplemented(); }
    async getProfile(user_id) { notImplemented(); }
    async createProfile(profile) { notImplemented(); }
    async updateProfile(profile) { notImplemented(); }
    async deleteProfile(user_id) { notImplemented(); }
    
    // `custom_commands` table is used for custom commands
    async getCustomCommands(guild_id) { notImplemented(); }
    async getCustomCommand(guild_id, command_name) { notImplemented(); }
    async createCustomCommand(command) { notImplemented(); }
    async updateCustomCommand(command) { notImplemented(); }
    async deleteCustomCommand(guild_id, command_name) { notImplemented(); }

    // 'stats' table is used for storing statistics about the bot
    async getStats() { notImplemented(); }
    async updateStats(stats) { notImplemented(); }
    async incrementSlashCommandUsage() { notImplemented(); }
    async incrementCommandUsage() { notImplemented(); }
}