const Command = require("../types/command");
const Module = require("../types/module");
module.exports = class extends Module {
    constructor(client, database) {
        super(client, database, 'Welcome');
    }

    async onMemberJoin(member, locale, guild) {
        if (!guild || !guild.welcome_channel) return;

        const channel_id = guild.welcome_channel;
        var message = guild.welcome_msg.replace('%user%', `<@${member.id}>`);
        if (!message) message = locale('global.welcome_msg', member.id);

        const channel = member.guild.channels.cache.get(channel_id);
        if (!channel) return;

        const embed = Command.createEmbed({ description: message })
        await channel.send({ embeds: [embed] });
    }
}
