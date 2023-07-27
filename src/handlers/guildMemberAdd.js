const localeBuilder = require('../locale');
const config = require('../../config.json');

module.exports = {
    name: 'guildMemberAdd',
    async execute(client, member) {
        var guild = await client.database.getGuild(member.guild.id);
        if (!guild) {
            guild = await client.database.createGuild(member.guild.id);
        }

        const locale = localeBuilder(guild ? guild.language : config.default_language);

        for (const module of client.modules) {
            module.onMemberJoin(member, locale, guild)
                .catch(err => client.logger.error('Module', `⚠️ ${module.name} failed to handle member join event: ${err.stack}`));
        }
    }
}