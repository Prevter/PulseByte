const DatabaseContext = require('../types/db_context');
const sqlite3 = require('sqlite3').verbose();

module.exports = class SqliteContext extends DatabaseContext {
    init() {
        this.logger.info('Database', '📅 Connecting to SQLite database...');
        this.db = new sqlite3.Database(this.connection_string);

        // Create tables
        this.db.serialize(() => {
            this.db.run(`CREATE TABLE IF NOT EXISTS guilds (
                id TEXT PRIMARY KEY,
                prefix TEXT NOT NULL,
                language TEXT NOT NULL,
                xp_enabled INTEGER NOT NULL
            )`);

            this.db.run(`CREATE TABLE IF NOT EXISTS users (
                id TEXT,
                guild_id TEXT NOT NULL,
                xp INTEGER NOT NULL,
                message_count INTEGER NOT NULL,
                last_message INTEGER NOT NULL,
                PRIMARY KEY (id, guild_id)
            )`);

            this.db.run(`CREATE TABLE IF NOT EXISTS profiles (
                id TEXT PRIMARY KEY,
                card_color TEXT NOT NULL,
                card_background TEXT NOT NULL,
                card_opacity INTEGER NOT NULL
            )`);

            this.db.run(`CREATE TABLE IF NOT EXISTS custom_commands (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guild_id TEXT NOT NULL,
                name TEXT NOT NULL,
                mode TEXT NOT NULL,
                use_prefix INTEGER NOT NULL,
                code TEXT NOT NULL
            )`);

            // This table has only one row, but it's easier to use a table than to store it in a file
            // Stats:
            // - commands_executed: total number of commands executed
            // - slash_commands: number of slash commands executed
            this.db.run(`CREATE TABLE IF NOT EXISTS stats (
                commands_executed INTEGER NOT NULL,
                slash_commands INTEGER NOT NULL
            )`);
        });
    }

    close() {
        this.db.close();
    }

    getGuilds() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM guilds', (err, rows) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve(rows);
            });
        });
    }

    getGuild(guild_id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM guilds WHERE id = ?', [guild_id], (err, row) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve(row);
            });
        });
    }

    createGuild(guild) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO guilds (id, prefix, language, xp_enabled) VALUES (?, ?, ?, ?)', [guild.id, guild.prefix, guild.language, guild.xp_enabled], (err) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    updateGuild(guild) {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE guilds SET prefix = ?, language = ?, xp_enabled = ? WHERE id = ?', [guild.prefix, guild.language, guild.xp_enabled, guild.id], (err) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    deleteGuild(guild_id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM guilds WHERE id = ?', [guild_id], (err) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    getUsers(guild_id) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM users WHERE guild_id = ? ORDER BY xp DESC', [guild_id], (err, rows) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve(rows);
            });
        });
    }

    getUser(user_id, guild_id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE id = ? AND guild_id = ?', [user_id, guild_id], (err, row) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve(row);
            });
        });
    }

    createUser(user) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO users (id, guild_id, xp, message_count, last_message) VALUES (?, ?, ?, ?, ?)', [user.id, user.guild_id, user.xp, user.message_count, user.last_message], (err) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    updateUser(user) {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE users SET xp = ?, message_count = ?, last_message = ? WHERE id = ? AND guild_id = ?', [user.xp, user.message_count, user.last_message, user.id, user.guild_id], (err) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    deleteUser(user_id, guild_id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM users WHERE id = ? AND guild_id = ?', [user_id, guild_id], (err) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    getProfiles() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM profiles', (err, rows) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve(rows);
            });
        });
    }

    getProfile(user_id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM profiles WHERE id = ?', [user_id], (err, row) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve(row);
            });
        });
    }

    createProfile(profile) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO profiles (id, card_color, card_background, card_opacity) VALUES (?, ?, ?, ?)', [profile.id, profile.card_color, profile.card_background, profile.card_opacity], (err) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    updateProfile(profile) {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE profiles SET card_color = ?, card_background = ?, card_opacity = ? WHERE id = ?', [profile.card_color, profile.card_background, profile.card_opacity, profile.id], (err) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    deleteProfile(user_id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM profiles WHERE id = ?', [user_id], (err) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    getCustomCommands(guild_id) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM custom_commands WHERE guild_id = ?', [guild_id], (err, rows) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve(rows);
            });
        });
    }

    getCustomCommand(guild_id, command_name) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM custom_commands WHERE guild_id = ? AND command_name = ?', [guild_id, command_name], (err, row) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve(row);
            });
        });
    }

    createCustomCommand(command) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO custom_commands (guild_id, command_name, command_response) VALUES (?, ?, ?)', [command.guild_id, command.command_name, command.command_response], (err) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    updateCustomCommand(command) {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE custom_commands SET command_response = ? WHERE guild_id = ? AND command_name = ?', [command.command_response, command.guild_id, command.command_name], (err) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    deleteCustomCommand(guild_id, command_name) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM custom_commands WHERE guild_id = ? AND command_name = ?', [guild_id, command_name], (err) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    getStats() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM stats', (err, row) => {
                if (err) {
                    this.logger.error('Database', err);
                    reject(err);
                }
                // if no stats exist, create them
                if (row.length === 0) {
                    this.db.run('INSERT INTO stats (commands_executed, slash_commands) VALUES (?, ?)', [0, 0], (err) => {
                        if (err) {
                            this.logger.error('Database', err);
                            reject(err);
                        }
                    });
                    row = [{
                        commands_executed: 0,
                        slash_commands: 0
                    }];
                }
                resolve(row[0]);
            });
        });
    }

    updateStats(stats) {
        this.db.run('UPDATE stats SET commands_executed = ?, slash_commands = ?', [stats.commands_executed, stats.slash_commands], (err) => {
            if (err) {
                this.logger.error('Database', err);
            }
        });
    }

    incrementCommandUsage() {
        this.db.run('UPDATE stats SET commands_executed = commands_executed + 1', (err) => {
            if (err) {
                this.logger.error('Database', err);
            }
        });
    }

    incrementSlashCommandUsage() {
        this.db.run('UPDATE stats SET slash_commands = slash_commands + 1', (err) => {
            if (err) {
                this.logger.error('Database', err);
            }
        });
    }

}