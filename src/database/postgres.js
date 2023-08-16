const DatabaseContext = require('../types/db_context');
const { Client } = require('pg');
const config = require('../../config.json');

module.exports = class PostgresContext extends DatabaseContext {
    async init() {
        this.logger.info('Database', '🐘 Connecting to PostgreSQL database...');
        this.client = new Client(this.connection_string);
        await this.client.connect();

        // Create tables if they don't exist
        const createTable = async (name, columns) => {
            const res = await this.client.query(`SELECT to_regclass('${name}')`);
            if (!res.rows[0].to_regclass) {
                await this.client.query(`CREATE TABLE ${name} (${columns})`);
            }
        }

        await createTable('guilds', 'id BIGINT PRIMARY KEY, prefix TEXT, language TEXT, xp_enabled BOOLEAN, automod_enabled BOOLEAN, welcome_channel BIGINT, welcome_msg TEXT, log_channel BIGINT');
        await createTable('users', 'id BIGINT, guild_id BIGINT, xp BIGINT, PRIMARY KEY (id, guild_id)');
        await createTable('profiles', 'id BIGINT PRIMARY KEY, description TEXT, color TEXT');
        await createTable('custom_commands', 'guild_id BIGINT, command_name TEXT, response TEXT, PRIMARY KEY (guild_id, command_name)');
        await createTable('stats', 'commands_executed BIGINT, slash_commands BIGINT');
    }

    close() {
        this.client.end();
    }

    async getGuilds() {
        const guilds = await this.client.query('SELECT * FROM guilds');
        return guilds.rows;
    }
    async getGuild(guild_id) {
        const guild = await this.client.query('SELECT * FROM guilds WHERE id = $1', [guild_id]);
        return guild.rows[0];
    }
    async createGuild(guild_id) {
        const guild = {
            id: guild_id,
            prefix: config.bot.prefix,
            language: config.default_language,
            xp_enabled: config.bot.xp.enabled ? 1 : 0,
            automod_enabled: config.bot.automod.enabled ? 1 : 0,
            welcome_channel: null,
            welcome_msg: null,
            log_channel: null,
        };

        await this.client.query('INSERT INTO guilds (id, prefix, language, xp_enabled, automod_enabled, welcome_channel, welcome_msg, log_channel) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [guild.id, guild.prefix, guild.language, guild.xp_enabled, guild.automod_enabled, guild.welcome_channel, guild.welcome_msg, guild.log_channel]);

        return guild;
    }
    async updateGuild(guild) {
        await this.client.query('UPDATE guilds SET prefix = $1, language = $2, xp_enabled = $3, automod_enabled = $4, welcome_channel = $5, welcome_msg = $6, log_channel = $7 WHERE id = $8', [guild.prefix, guild.language, guild.xp_enabled, guild.automod_enabled, guild.welcome_channel, guild.welcome_msg, guild.log_channel, guild.id]);
    }
    async deleteGuild(guild_id) {
        await this.client.query('DELETE FROM guilds WHERE id = $1', [guild_id]);
    }

    async getUsers(guild_id) {
        const users = await this.client.query('SELECT * FROM users WHERE guild_id = $1 ORDER BY xp DESC', [guild_id]);
        return users.rows;
    }
    async getUser(user_id, guild_id) {
        const user = await this.client.query('SELECT * FROM users WHERE id = $1 AND guild_id = $2', [user_id, guild_id]);
        return user.rows[0];
    }
    async createUser(user) {
        await this.client.query('INSERT INTO users (id, guild_id, xp) VALUES ($1, $2, $3)', [user.id, user.guild_id, user.xp]);
    }
    async updateUser(user) {
        await this.client.query('UPDATE users SET xp = $1 WHERE id = $2 AND guild_id = $3', [user.xp, user.id, user.guild_id]);
    }
    async deleteUser(user_id, guild_id) {
        await this.client.query('DELETE FROM users WHERE id = $1 AND guild_id = $2', [user_id, guild_id]);
    }

    async getProfiles() {
        const profiles = await this.client.query('SELECT * FROM profiles');
        return profiles.rows;
    }
    async getProfile(user_id) {
        const profile = await this.client.query('SELECT * FROM profiles WHERE id = $1', [user_id]);
        return profile.rows[0];
    }
    async createProfile(profile) {
        await this.client.query('INSERT INTO profiles (id, description, color) VALUES ($1, $2, $3)', [profile.id, profile.description, profile.color]);
    }
    async updateProfile(profile) {
        await this.client.query('UPDATE profiles SET description = $1, color = $2 WHERE id = $3', [profile.description, profile.color, profile.id]);
    }
    async deleteProfile(user_id) {
        await this.client.query('DELETE FROM profiles WHERE id = $1', [user_id]);
    }

    async getCustomCommands(guild_id) {
        const custom_commands = await this.client.query('SELECT * FROM custom_commands WHERE guild_id = $1', [guild_id]);
        return custom_commands.rows;
    }
    async getCustomCommand(guild_id, command_name) {
        const custom_command = await this.client.query('SELECT * FROM custom_commands WHERE guild_id = $1 AND command_name = $2', [guild_id, command_name]);
        return custom_command.rows[0];
    }
    async createCustomCommand(custom_command) {
        await this.client.query('INSERT INTO custom_commands (guild_id, command_name, response) VALUES ($1, $2, $3)', [custom_command.guild_id, custom_command.command_name, custom_command.response]);
    }
    async updateCustomCommand(custom_command) {
        await this.client.query('UPDATE custom_commands SET response = $1 WHERE guild_id = $2 AND command_name = $3', [custom_command.response, custom_command.guild_id, custom_command.command_name]);
    }
    async deleteCustomCommand(guild_id, command_name) {
        await this.client.query('DELETE FROM custom_commands WHERE guild_id = $1 AND command_name = $2', [guild_id, command_name]);
    }

    async getStats() {
        const stats = await this.client.query('SELECT * FROM stats');
        if (stats.rows.length === 0) {
            await this.client.query('INSERT INTO stats (commands_executed, slash_commands) VALUES (0, 0)');
            return { commands_executed: 0, slash_commands: 0 };
        }
        return {
            commands_executed: parseInt(stats.rows[0].commands_executed),
            slash_commands: parseInt(stats.rows[0].slash_commands)
        }
    }

    async updateStats(stats) {
        await this.client.query('UPDATE stats SET commands_executed = $1, slash_commands = $2', [stats.commands_executed, stats.slash_commands]);
    }

    async incrementCommandUsage() {
        await this.client.query('UPDATE stats SET commands_executed = commands_executed + 1');
    }

    async incrementSlashCommandUsage() {
        await this.client.query('UPDATE stats SET slash_commands = slash_commands + 1');
    }
}