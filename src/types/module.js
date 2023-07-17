const { Message } = require("discord.js");
require('../utils.js')

module.exports = class Module {
    constructor(client, database, name) {
        this.client = client;
        this.discord = client.client;
        this.database = database;
        this.name = name;
        this.logger = client.logger;
    }

    /**
     * Called when there is a new message
     * @param {Message} message 
     * @param {Function} locale 
     */
    async onMessage(message, locale) { }

    /**
     * Called when a member joins the guild
     * @param {GuildMember} member
     * @param {Function} locale
     * @param {Object} guild
     */
    async onMemberJoin(member, locale, guild) { }
}