const Module = require("../types/module");
const config = require("../../config.json");

const randomXp = () => {
    return Math.floor(Math.random() * (config.bot.xp.max - config.bot.xp.min + 1)) + config.bot.xp.min;
}

const getLevelXp = (level) => {
    return 5 / 6 * level * (2 * Math.pow(level, 2) + 27 * level + 91);
}

const getLevel = (total_xp) => {
    let level = 0;
    while (total_xp >= getLevelXp(level))
        level++;
    return level - 1;
}

module.exports = class XPModule extends Module {
    constructor(client, database) {
        super(client, database, 'Experience');
    }

    onMessage(message, locale, guild_data, user_data) {
        // Only run if the message is in a guild
        if (!guild_data) return;

        // Only run if xp is enabled on this server
        if (!guild_data.xp_enabled) return;

        const experience = randomXp();
        const current_time = Date.now();

        if (user_data && (current_time - user_data.last_message > config.bot.xp.cooldown * 1000)) {
            const level = getLevel(user_data.xp);
            const new_level = getLevel(user_data.xp + experience);

            user_data.xp += experience;
            user_data.last_message = current_time;
            this.database.updateUser(user_data);

            if (new_level > level) {
                message.reply(locale('xp.level_up', new_level));
                this.logger.log(`User ${user_data.id} leveled up to level ${new_level} in guild ${user_data.guild_id}`)
            }
        }
        else if (!user_data) {
            user_data = {
                id: message.author.id,
                guild_id: message.guild.id,
                xp: experience,
                last_message: current_time
            }
            this.database.createUser(user_data);
            this.logger.log(`Created user ${user_data.id} in guild ${user_data.guild_id}`)
        }
    }
}
