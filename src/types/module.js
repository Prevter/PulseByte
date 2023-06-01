const { Message } = require("discord.js");

module.exports = class Module {
    constructor(client, database, name) {
        this.client = client;
        this.database = database;
        this.name = name;
        this.logger = client.logger;
    }

    /**
     * Called when there is a new message
     * @param {Message} message 
     * @param {Function} locale 
     */
    onMessage(message, locale) { }
}