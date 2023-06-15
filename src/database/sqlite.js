const DatabaseContext = require('../types/db_context');
const sqlite3 = require('sqlite3').verbose();

module.exports = class SqliteContext extends DatabaseContext {
    init() {
        this.logger.info('[DATABASE] 📅 Connecting to SQLite database...');
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
        });
    }

    close() {
        this.db.close();
    }

    getGuilds() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM guilds', (err, rows) => {
                if (err) {
                    this.logger.error('[DATABASE]', err);
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
                    this.logger.error('[DATABASE]', err);
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
                    this.logger.error('[DATABASE]', err);
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
                    this.logger.error('[DATABASE]', err);
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
                    this.logger.error('[DATABASE]', err);
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
                    this.logger.error('[DATABASE]', err);
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
                    this.logger.error('[DATABASE]', err);
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
                    this.logger.error('[DATABASE]', err);
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
                    this.logger.error('[DATABASE]', err);
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
                    this.logger.error('[DATABASE]', err);
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
                    this.logger.error('[DATABASE]', err);
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
                    this.logger.error('[DATABASE]', err);
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
                    this.logger.error('[DATABASE]', err);
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
                    this.logger.error('[DATABASE]', err);
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
                    this.logger.error('[DATABASE]', err);
                    reject(err);
                }
                resolve();
            });
        });
    }

}