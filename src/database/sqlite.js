const DatabaseContext = require('../types/db_context');
const sqlite3 = require('sqlite3').verbose();

module.exports = class SqliteContext extends DatabaseContext {
    init() {
        this.logger.info('📅 Connecting to SQLite database...');
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
                last_message INTEGER NOT NULL,
                PRIMARY KEY (id, guild_id)
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
                    this.logger.error(err);
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
                    this.logger.error(err);
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
                    this.logger.error(err);
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
                    this.logger.error(err);
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
                    this.logger.error(err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    getUsers(guild_id) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM users WHERE guild_id = ?', [guild_id], (err, rows) => {
                if (err) {
                    this.logger.error(err);
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
                    this.logger.error(err);
                    reject(err);
                }
                resolve(row);
            });
        });
    }

    createUser(user) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO users (id, guild_id, xp, last_message) VALUES (?, ?, ?, ?)', [user.id, user.guild_id, user.xp, user.last_message], (err) => {
                if (err) {
                    this.logger.error(err);
                    reject(err);
                }
                resolve();
            });
        });
    }

    updateUser(user) {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE users SET xp = ?, last_message = ? WHERE id = ? AND guild_id = ?', [user.xp, user.last_message, user.id, user.guild_id], (err) => {
                if (err) {
                    this.logger.error(err);
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
                    this.logger.error(err);
                    reject(err);
                }
                resolve();
            });
        });
    }

}