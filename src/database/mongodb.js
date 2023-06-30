const DatabaseContext = require('../types/db_context');
const { MongoClient } = require("mongodb");

module.exports = class SqliteContext extends DatabaseContext {
    init() {
        this.logger.info('Database', '🥭 Connecting to MongoDB database...');
        this.client = new MongoClient(this.connection_string, { useUnifiedTopology: true });
        this.db = this.client.db();

        // Create collections if they don't exist
        const createCollection = async (name) => {
            const collections = await this.db.listCollections().toArray();
            if (!collections.some(c => c.name === name)) {
                await this.db.createCollection(name);
            }
        };

        createCollection('guilds');
        createCollection('users');
        createCollection('profiles');
        createCollection('custom_commands');
        createCollection('stats');
    }

    close() {
        this.client.close();
    }

    async getGuilds() {
        const guilds = await this.db.collection('guilds').find().toArray();
        return guilds;
    }
    async getGuild(guild_id) {
        const guild = await this.db.collection('guilds').findOne({ id: guild_id });
        return guild;
    }
    async createGuild(guild) {
        await this.db.collection('guilds').insertOne(guild);
    }
    async updateGuild(guild) {
        await this.db.collection('guilds').updateOne({ id: guild.id }, { $set: guild });
    }
    async deleteGuild(guild_id) {
        await this.db.collection('guilds').deleteOne({ id: guild_id });
    }

    async getUsers(guild_id) {
        const users = await this.db.collection('users').find({ guild_id: guild_id }).toArray();
        return users;
    }
    async getUser(user_id, guild_id) {
        const user = await this.db.collection('users').findOne({ id: user_id, guild_id: guild_id });
        return user;
    }
    async createUser(user) {
        await this.db.collection('users').insertOne(user);
    }
    async updateUser(user) {
        await this.db.collection('users').updateOne({ id: user.id, guild_id: user.guild_id }, { $set: user });
    }
    async deleteUser(user_id, guild_id) {
        await this.db.collection('users').deleteOne({ id: user_id, guild_id: guild_id });
    }

    async getProfiles() {
        const profiles = await this.db.collection('profiles').find().toArray();
        return profiles;
    }
    async getProfile(user_id) {
        const profile = await this.db.collection('profiles').findOne({ id: user_id });
        return profile;
    }
    async createProfile(profile) {
        await this.db.collection('profiles').insertOne(profile);
    }
    async updateProfile(profile) {
        await this.db.collection('profiles').updateOne({ id: profile.id }, { $set: profile });
    }
    async deleteProfile(user_id) {
        await this.db.collection('profiles').deleteOne({ id: user_id });
    }

    async getCustomCommands(guild_id) {
        const custom_commands = await this.db.collection('custom_commands').find({ guild_id: guild_id }).toArray();
        return custom_commands;
    }
    async getCustomCommand(guild_id, command_name) {
        const custom_command = await this.db.collection('custom_commands').findOne({ guild_id: guild_id, name: command_name });
        return custom_command;
    }
    async createCustomCommand(custom_command) {
        await this.db.collection('custom_commands').insertOne(custom_command);
    }
    async updateCustomCommand(custom_command) {
        await this.db.collection('custom_commands').updateOne({ guild_id: custom_command.guild_id, name: custom_command.name }, { $set: custom_command });
    }
    async deleteCustomCommand(guild_id, command_name) {
        await this.db.collection('custom_commands').deleteOne({ guild_id: guild_id, name: command_name });
    }

    async getStats() {
        const stats = await this.db.collection('stats').find().toArray();
        // if there are no stats, create a new one
        if (stats.length === 0) {
            await this.db.collection('stats').insertOne({ commands_executed: 0, slash_commands: 0 });
            return { commands_executed: 0, slash_commands: 0 };
        }
        return stats[0];
    }

    async updateStats(stats) {
        await this.db.collection('stats').updateOne({}, { $set: stats });
    }

    async incrementCommandUsage() {
        const stats = await this.getStats();
        stats.commands_executed++;
        await this.updateStats(stats);
    }

    async incrementSlashCommandUsage() {
        const stats = await this.getStats();
        stats.slash_commands++;
        await this.updateStats(stats);
    }
}