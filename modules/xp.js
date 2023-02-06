const xpTools = require('../common/xpFunctions.js');
const { xp } = require('../config.json');
const { getServerLocale } = require('../common/utils.js');

module.exports = {
    name: "Experience",
    onMessage: async (message, db, client) => {
        // check if xp is enabled on this server
        if (!message.guild) return;

        let sql = `SELECT xp_enabled FROM settings WHERE guild_id = '${message.guild.id}'`;
        const row = db.prepare(sql).get();
        let enabled = true;
        if (row) {
            enabled = row.xp_enabled;
        }

        if (enabled) {
            // random xp between 15 and 25
            let experience = xpTools.getRandomXp();
    
            // get current xp
            let sql = `SELECT * FROM experience WHERE user_id = '${message.author.id}' AND guild_id = '${message.guild.id}'`;
            
            const row = db.prepare(sql).get();
            let current_time = Date.now();
            if (row) {
                // check if last message was sent more than 1 minute ago
                if (current_time - row.last_message > xp.cooldown * 1000) {
                    // add xp
                    sql = `UPDATE experience SET xp = ${row.xp + experience}, last_message = ${current_time} WHERE user_id = '${message.author.id}' AND guild_id = '${message.guild.id}'`;
                    db.prepare(sql).run();
                    
                    let level = xpTools.getLevel(row.xp);
                    let new_level = xpTools.getLevel(row.xp + experience);
    
                    if (new_level > level) {
                        const locale = getServerLocale(db, message.guildId);
                        message.reply(xp.level_up_message[locale].replace('{0}', new_level));
                    }
                }
            } else {
                // add user to database
                sql = `INSERT INTO experience (user_id, guild_id, xp, last_message) VALUES ('${message.author.id}', '${message.guild.id}', ${experience}, ${current_time})`;
                db.prepare(sql).run();
            }
        }
    },
}