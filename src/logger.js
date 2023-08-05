const fs = require('fs');
const chalk = require('chalk');
const Command = require('./types/command.js');
const { WebhookClient } = require('discord.js');
const levels = ['log', 'info', 'warn', 'error', 'fatal'];
const levels_map = {
    log: {
        name: 'Log',
        hex: '#6c757d',
        emoji: '📝',
        color: chalk.white,
    },
    info: {
        name: 'Info',
        hex: '#17a2b8',
        emoji: 'ℹ️',
        color: chalk.cyan
    },
    warn: {
        name: 'Warning',
        hex: '#ffc107',
        emoji: '⚠️',
        color: chalk.yellow
    },
    error: {
        name: 'Error',
        hex: '#dc3545',
        emoji: '❌',
        color: chalk.red
    },
    fatal: {
        name: 'Fatal error',
        hex: '#ad0a0a',
        emoji: '🔥',
        color: chalk.redBright
    }
}

const convertObject = (obj) => {
    if (typeof obj === 'object') {
        return JSON.stringify(obj, null, 2);
    } else {
        return obj;
    }
}

const getString = (type, ...args) => {
    return `(${type.toUpperCase()}) ${args.map(a => convertObject(a)).join(' ')}\n`;
}

module.exports = class Logger {
    constructor(options = {
        level: 'info',
        file: {
            enable: true,
            path: './logs.log'
        },
        stdout: {
            enable: true
        },
        webhook: {
            enable: false,
            override_level: null,
            url: null
        }
    }) {
        this.options = options;
        this.level = this.options.level;
        this.file = this.options.file;
        this.stdout = this.options.stdout;
        this.webhook = this.options.webhook;

        // Setup webhook
        if (this.webhook.enable) {
            this.webhook_client = new WebhookClient({ url: this.options.webhook.url });
        }
    }

    checkLevel(level) {
        return levels.indexOf(level) >= levels.indexOf(this.level);
    }

    /**
     * Logs with the level 'log'
     * @param  {...any} args The arguments to log
     */
    log(tag, ...args) {
        if (this.checkLevel('log')) {
            if (this.stdout.enable) this.outputToConsole('log', tag, ...args);
            if (this.file.enable) this.writeToFile(getString('LOG', `[${tag.toUpperCase()}]`, ...args));
            if (this.webhook.enable) this.sendToWebhook('log', tag, ...args);
        }
    }

    /**
     * Logs with the level 'info'
     * @param  {...any} args The arguments to log
     */
    info(tag, ...args) {
        if (this.checkLevel('info')) {
            if (this.stdout.enable) this.outputToConsole('info', tag, ...args);
            if (this.file.enable) this.writeToFile(getString('INFO', `[${tag.toUpperCase()}]`, ...args));
            if (this.webhook.enable) this.sendToWebhook('info', tag, ...args);
        }
    }

    /**
     * Logs with the level 'warn'
     * @param  {...any} args The arguments to log
     */
    warn(tag, ...args) {
        if (this.checkLevel('warn')) {
            if (this.stdout.enable) this.outputToConsole('warn', tag, ...args);
            if (this.file.enable) this.writeToFile(getString('WARN', `[${tag.toUpperCase()}]`, ...args));
            if (this.webhook.enable) this.sendToWebhook('warn', tag, ...args);
        }
    }

    /**
     * Logs with the level 'error'
     * @param  {...any} args The arguments to log
     */
    error(tag, ...args) {
        if (this.checkLevel('error')) {
            if (this.stdout.enable) this.outputToConsole('error', tag, ...args);
            if (this.file.enable) this.writeToFile(getString('ERROR', `[${tag.toUpperCase()}]`, ...args));
            if (this.webhook.enable) this.sendToWebhook('error', tag, ...args);
        }
    }

    /**
     * Logs with the level 'fatal'
     * @param  {...any} args The arguments to log
     */
    fatal(tag, ...args) {
        if (this.checkLevel('fatal')) {
            if (this.stdout.enable) this.outputToConsole('fatal', tag, ...args);
            if (this.file.enable) this.writeToFile(getString('FATAL', `[${tag.toUpperCase()}]`, ...args));
            if (this.webhook.enable) this.sendToWebhook('fatal', tag, ...args);
        }
    }

    outputToConsole(level, tag, ...args) {
        const { color, emoji } = levels_map[level];
        if (level === 'fatal') level = 'error'; // fatal is not a valid console level
        const time_str = chalk.gray(`[${new Date().toLocaleString()}]`);
        console[level](color(`${time_str} ${emoji} [${tag}]`), ...args);
    }

    /**
     * Writes a string to the log file
     * @param {string} str logged string
     */
    writeToFile(str) {
        const formatted = `[${new Date().toLocaleString()}] ${str}`;
        fs.appendFile(this.file.path, formatted, (err) => {
            if (err) throw err;
        });
    }

    /**
     * Clears the log file
     */
    clearFile() {
        fs.writeFile(this.file.path, '', (err) => {
            if (err) throw err;
        });
    }

    sendToWebhook(level, tag, ...args) {
        // check if the level is overriden and if the level is lower than the override level
        if (this.webhook.override_level && (levels.indexOf(level) < levels.indexOf(this.webhook.override_level)))
            return;

        const { name, hex, emoji } = levels_map[level];

        try {
            const embed = Command.createEmbed({
                author: { name: `Source: "${tag}"` },
                title: `${emoji} ${name}`,
                description: args.map(a => convertObject(a)).join(' '),
                color: hex,
                timestamp: true
            });

            this.webhook_client.send({ embeds: [embed] });
        } catch (err) {
            this.outputToConsole('fatal', 'Logger', err);
        }
    }
}