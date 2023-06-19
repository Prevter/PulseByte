const Module = require("../types/module");
const Command = require("../types/command");

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

const parseSendMessage = (args, storage) => {
    const content = args[0];
    if (!content) return null;

    if (content.startsWith('{') && content.endsWith('}')) {
        return { embeds: [Command.createEmbed(JSON.parse(replaceArgs(content, storage)))] };
    }
    else if (content.startsWith('"') && content.endsWith('"')) {
        return replaceArgs(content, storage).slice(1, -1);
    }
    else if (content.startsWith('$')) {
        return storage[content];
    }

    return content;
}

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

class DeleteAction extends Action {
    async run(message, storage) {
        if (!this.args[0]) {
            await message.delete();
        } else {
            await storage[this.args[0]].delete();
        }
    }
}

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

class SleepAction extends Action {
    async run(message) {
        const time = parseInt(this.args[0]);
        if (isNaN(time)) return;
        await new Promise(resolve => setTimeout(resolve, time));
    }
}

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
            for (const action of cmd) {
                await action.run(message, storage);
            }
        }
    }
}
