const DatabaseContext = require('../types/db_context');
const { MongoClient } = require("mongodb");

module.exports = class SqliteContext extends DatabaseContext {
    init() {
        this.logger.info('[DATABASE] 🥭 Connecting to MongoDB database...');
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
}