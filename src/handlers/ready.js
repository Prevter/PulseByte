const { ActivityType } = require('discord.js');
const config = require('../../config');

module.exports = {
    name: 'ready',
    once: true,
    execute(client, c) {
        // client.logger.info('Discord', `✅ Ready! Logged in as ${c.user.tag}`);
    
        // c.user.setActivity({
        //     name: config.bot.activity.name,
        //     type: ActivityType[config.bot.activity.type]
        // });
    
        // client.registerCommands();
    }
}