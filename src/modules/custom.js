const Module = require("../types/module");
const Command = require("../types/command");
const config = require('../../config');

class Action {
    constructor(args, client, database) {
        this.args = args;
        this.client = client;
        this.database = database;
        this.discord = client.client;
    }

    static factory(name, args, client, database) {
        switch (name) {
            case 'reply':
                return new ReplyAction(args, client, database);
            case 'delete':
                return new DeleteAction(args, client, database);
            case 'react':
                return new ReactAction(args, client, database);
            case 'edit':
                return new EditAction(args, client, database);
            case 'send':
                return new SendAction(args, client, database);
            case 'send_channel':
                return new SendChannelAction(args, client, database);
            case 'sleep':
                return new SleepAction(args, client, database);
            case 'set':
                return new SetAction(args, client, database);
            case 'choose':
                return new ChooseAction(args, client, database);
            case 'random':
                return new RandomAction(args, client, database);
            case 'regex':
                return new RegexAction(args, client, database);
            case 'isset':
                return new IsSetAction(args, client, database);
            case 'ban':
                return new BanAction(args, client, database);
            default:
                return null;
        }
    }

    // override toString to make it easier to debug
    toString() {
        return `${this.constructor.name}(${this.args.join(', ')})`;
    }
}

const replaceArgs = (string, storage) => {
    for (const key in storage) {
        string = string.replace(`%${key}%`, storage[key]);
    }
    return string;
}

const parseArgument = (arg, storage) => {
    if (arg.startsWith('{') && arg.endsWith('}')) {
        return JSON.parse(replaceArgs(arg, storage));
    }
    else if (arg.startsWith('"') && arg.endsWith('"')) {
        return replaceArgs(arg, storage).slice(1, -1);
    }
    else if (storage[arg]) {
        return storage[arg];
    }
}

const parseSendMessage = (args, storage) => {
    const content = args[0];
    if (!content) return null;

    if (content.startsWith('{') && content.endsWith('}')) {
        return { embeds: [Command.createEmbed(JSON.parse(replaceArgs(content, storage)))] };
    }
    else if (content.startsWith('"') && content.endsWith('"')) {
        return replaceArgs(content, storage).slice(1, -1);
    }
    else if (storage[content]) {
        return storage[content];
    }

    return content;
}

// Replies to a message with a message
class ReplyAction extends Action {
    async run(message, storage) {
        const content = parseSendMessage(this.args, storage);
        if (!content) return;

        const msg = await message.reply(content);

        // second arg is used for storing the message
        if (this.args[1]) {
            storage[this.args[1]] = msg;
        }
    }
}

// Deletes a message or a message from storage
class DeleteAction extends Action {
    async run(message, storage) {
        if (!this.args[0]) {
            await message.delete();
        } else {
            await storage[this.args[0]].delete();
        }
    }
}

// Reacts to a message with emojis
class ReactAction extends Action {
    async run(message, storage) {
        // First argument is message handle in storage
        const msg = storage[this.args[0]];
        if (!msg) return;

        // Everything else is emojis
        for (const emoji of this.args.slice(1)) {
            await msg.react(emoji);
        }
    }
}

// Sends a message to the current channel
class SendAction extends Action {
    async run(message, storage) {
        const content = parseSendMessage(this.args, storage);
        if (!content) return;

        const msg = await message.channel.send(content);

        if (this.args[1]) {
            storage[this.args[1]] = msg;
        }
    }
}

// Sends a message to a specific channel
class SendChannelAction extends Action {
    async run(message, storage) {
        const channel = this.args[0];
        if (!channel) return;

        const content = parseSendMessage(this.args.slice(1), storage);
        if (!content) return;

        const channel_obj = this.discord.channels.cache.get(channel);
        if (!channel_obj) return;
        const msg = await channel_obj.send(content);

        if (this.args[2]) {
            storage[this.args[2]] = msg;
        }
    }
}

// Sleeps for a given amount of time
class SleepAction extends Action {
    async run(message) {
        const time = parseInt(this.args[0]);
        if (isNaN(time)) return;
        await new Promise(resolve => setTimeout(resolve, time));
    }
}

// Edits a message with new content
class EditAction extends Action {
    async run(message, storage) {
        // First argument is message handle in storage
        const msg = storage[this.args[0]];
        if (!msg) return;

        // Second argument is the new message content
        const content = parseSendMessage(this.args.slice(1), storage);
        if (!content) return;

        await msg.edit(content);
    }
}

// Sets a storage value to a string or object
class SetAction extends Action {
    async run(message, storage) {
        const key = this.args[0];
        const value = this.args[1];
        if (!key || !value) return;

        if (value.startsWith('{') && value.endsWith('}'))
            storage[key] = JSON.parse(replaceArgs(value, storage));
        else if (value.startsWith('"') && value.endsWith('"'))
            storage[key] = replaceArgs(value, storage).slice(1, -1);
        else if (storage[value])
            storage[key] = storage[value];
        else
            storage[key] = value;
    }
}

// Sets a storage value to a random choice from a list
class ChooseAction extends Action {
    async run(message, storage) {
        const key = this.args[0];
        const choices = this.args.slice(1);
        if (!key || !choices) return;

        const parsedChoices = [];
        for (let i = 0; i < choices.length; i++) {
            if (choices[i].startsWith('"') && choices[i].endsWith('"'))
                parsedChoices.push(choices[i].slice(1, -1));
            else if (storage[choices[i]])
                parsedChoices.push(storage[choices[i]]);
            else
                parsedChoices.push(choices[i]);
        }

        storage[key] = parsedChoices[Math.floor(Math.random() * parsedChoices.length)];
    }
}

// Sets a storage value to a random number between min and max
class RandomAction extends Action {
    async run(message, storage) {
        const key = this.args[0];
        const min = parseInt(this.args[1]);
        const max = parseInt(this.args[2]);
        if (!key || isNaN(min) || isNaN(max)) return;

        storage[key] = Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// Sets a storage value to the first match of a regex
class RegexAction extends Action {
    async run(message, storage) {
        const key = this.args[0];
        const text = parseArgument(this.args[1], storage);
        const regex = parseArgument(this.args[2], storage);
        if (!key || !text || !regex) return;

        const match = text.match(new RegExp(regex));
        if (!match) return;

        storage[key] = match[1];
    }
}

// Quits the program if a storage value is not set
class IsSetAction extends Action {
    async run(message, storage) {
        const key = this.args[0];
        if (!key || !storage[key])
            return 'quit';
    }
}

// {[ ban <user> [result embed] ]}
// Runs "ban" command and stores the result in storage if needed
class BanAction extends Action {
    async run(message, storage) {
        const user = this.args[0];
        let member = user;
        if (storage[user]) {
            member = storage[user];
        }
        try {
            member = await Command.loadMember(message.guild, member);
        }
        catch (e) {
            member = null;
        }
        const result = await this.banUser(
            message.member, member,
            `pacman: removed package ${member?.user?.tag}`,
            message.locale);
        if (this.args[1]) {
            storage[this.args[1]] = { embeds: [result.embed] };
        }
    }
    async banUser(author, member, reason, locale) {

        if (!member)
            return { result: false, embed: Command.createErrorEmbed(locale('ban.no_member')) };

        if (member.id === author.id)
            return { result: false, embed: Command.createErrorEmbed(locale('ban.self')) };

        const isOwner = member.id === member.guild.ownerId;
        const { PermissionsBitField } = require('discord.js');
        const isAdmin = member.permissions.has(PermissionsBitField.Flags.Administrator);
        const isBotOwner = config.bot.owners.includes(author.id);

        if (!isOwner && !isAdmin && !isBotOwner && member.roles.highest.position >= author.roles.highest.position)
            return { result: false, embed: Command.createErrorEmbed(locale('ban.higher_role')) };

        if (!member.bannable)
            return { result: false, embed: Command.createErrorEmbed(locale('ban.not_bannable')) };

        if (reason && reason.length === 0)
            reason = null;

        try {
            await member.ban({ reason: reason ?? locale('ban.no_reason') });
        } catch (e) {
            return { result: false, embed: Command.createErrorEmbed(locale('ban.failed')) };
        }

        return {
            result: true,
            embed: Command.createEmbed({
                title: locale('ban.title', member.user.tag.stripTag(true)),
                description: locale('ban.description', reason ?? locale('ban.no_reason')),
                author: {
                    name: author.user.username,
                    iconURL: author.user.avatarURL()
                },
                timestamp: true,
                footer: { text: `ID: ${member.id}` },
                thumbnail: member.user.avatarURL()
            })
        };
    }
}

module.exports = class CustomCommands extends Module {
    constructor(client, database) {
        super(client, database, 'Custom Commands');
    }

    parseBlock(block) {
        const args = [];
        let currentArg = '';
        let withinQuotes = false;
        let withinObject = 0;

        for (let i = 0; i < block.length; i++) {
            const char = block[i];

            if (char === '"') {
                withinQuotes = !withinQuotes;
            } else if (char === '{') {
                withinObject++;
            } else if (char === '}') {
                withinObject--;
            }

            if (char === ' ' && !withinQuotes && withinObject === 0) {
                if (currentArg !== '') {
                    args.push(currentArg);
                    currentArg = '';
                }
            } else {
                currentArg += char;
            }
        }

        if (currentArg !== '') {
            args.push(currentArg);
        }

        return args;
    }

    /**
     * Parses a custom command code and returns an array of actions
     * @param {String} code Custom command code 
     * @returns {Array} Array of actions
     */
    parseCommand(code) {
        // Get {[ ]} blocks
        const blocks = code.match(/\{\[.*?\]\}/gs);
        if (!blocks) return [];

        // Parse blocks
        const actions = [];
        for (const block of blocks) {
            const args = this.parseBlock(block.slice(2, -2));
            const name = args[0];
            const data = args.slice(1);
            const action = Action.factory(name, data, this.client, this.database);
            if (action) actions.push(action);
        }

        return actions;
    }

    async onMessage(message, locale, guild_data, user_data) {
        if (!guild_data) return;

        // TODO: Get custom commands from database
        const custom_commands = await this.database.getCustomCommands(guild_data.id);
        if (!custom_commands) return;

        const content = message.content;
        for (const command of custom_commands) {
            let match = false;
            switch (command.mode) {
                case 'normal':
                    match = content === `${command.use_prefix ? guild_data.prefix : ''}${command.name}`;
                    break;
                case 'startsWith':
                    match = content.startsWith(`${command.use_prefix ? guild_data.prefix : ''}${command.name}`);
                    break;
                case 'endsWith':
                    match = content.endsWith(`${command.name}`);
                    break;
                case 'regex':
                    match = new RegExp(command.name).test(content);
                    break;
                case 'contains':
                    match = content.includes(`${command.name}`);
                    break;
            }

            if (!match) continue;

            this.logger.log('Custom Commands', `⚙️ ${message.author.tag.stripTag(true)} called a custom command: ${message.content} in '${message.guild.id}'`);

            // Parse command
            const cmd = this.parseCommand(command.code);
            if (!cmd) return;

            // Run actions
            let storage = {
                "$message": message,
                "$guild": message.guild,
                "$channel": message.channel,
                "$user": message.author,
                "$content": message.content,
                "$mention": `<@${message.author.id}>`,
            };
            message.locale = locale;
            for (const action of cmd) {
                console.log(`Running action: ${action}`);
                const result = await action.run(message, storage);
                if (result === 'quit') return;
            }
        }
    }
}
