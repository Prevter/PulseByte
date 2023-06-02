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
    
    async getGuilds() { notImplemented(); }
    async getGuild(guild_id) { notImplemented(); }
    async createGuild(guild) { notImplemented(); }
    async updateGuild(guild) { notImplemented(); }
    async deleteGuild(guild_id) { notImplemented(); }

    async getUsers() { notImplemented(); }
    async getUser(user_id, guild_id) { notImplemented(); }
    async createUser(user) { notImplemented(); }
    async updateUser(user) { notImplemented(); }
    async deleteUser(user_id, guild_id) { notImplemented(); }

    async getProfiles() { notImplemented(); }
    async getProfile(user_id) { notImplemented(); }
    async createProfile(profile) { notImplemented(); }
    async updateProfile(profile) { notImplemented(); }
    async deleteProfile(user_id) { notImplemented(); }
}