const Command = require("../../types/command");
var os = require('os');

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'status',
            aliases: ['stats', 'botinfo', 'stat', 'ping'],
            category: 'general'
        });
    }

    daysParser(days, locale) {
        if (days % 10 === 1 && days % 100 !== 11)
            return locale('!status.day.one');
        else if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20))
            return locale('!status.day.few') ?? locale('!status.day.other');
        else
            return locale('!status.day.other');
    }

    timeString(timePassed, locale) {
        let seconds = Math.floor(timePassed % 60);
        let minutes = Math.floor(timePassed / 60) % 60;
        let hours = Math.floor(timePassed / 3600) % 24;
        let days = Math.floor(timePassed / 86400);
        let result = '';
        if (days > 0)
            result += `${days} ${this.daysParser(days, locale)} `;
        if (hours > 0 || result.length > 0)
            result += `${hours}:`;
        if (minutes > 0 || result.length > 0)
            result += `${minutes < 10 ? '0' : ''}${minutes}:`;
        else
            result += `${minutes}:`;
        result += `${seconds < 10 ? '0' : ''}${seconds}`;
        return result;
    }

    async run(message, locale, args) {
        const serverCount = await this.client.getGuildCount();
        const ping = this.discord.ws.ping;
        const uptime = this.discord.uptime;
        const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        const nodeVersion = process.version;
        const osName = (()=>{
            switch (os.platform()) {
                case 'aix': return 'AIX';
                case 'darwin': return 'macOS';
                case 'freebsd': return 'FreeBSD';
                case 'linux': return 'Linux';
                case 'openbsd': return 'OpenBSD';
                case 'sunos': return 'SunOS';
                case 'win32': return 'Windows';
                case 'android': return 'Android';
                default: return os.platform();
            }
        })();
        const osVersion = os.release();
        const totalMemory = os.totalmem() / 1024 / 1024 / 1024;
        const freeMemory = os.freemem() / 1024 / 1024 / 1024;

        message.reply({
            embeds: [Command.createEmbed({
                title: locale('status.title'),
                description: locale('status.description', serverCount),
                fields: [
                    {
                        name: locale('status.ping'),
                        value: ping === -1 ? locale('status.connecting') : locale('status.ping_format', ping),
                        inline: true
                    },
                    {
                        name: locale('status.uptime'),
                        value: this.timeString(uptime / 1000, locale),
                        inline: true
                    },
                    {
                        name: locale('status.memory'),
                        value: locale('status.memory_format', memoryUsage.toFixed(2)),
                        inline: true
                    },
                    {
                        name: locale('status.total_memory'),
                        value: locale('status.total_memory_format', (totalMemory - freeMemory).toFixed(2), totalMemory.toFixed(2)),
                        inline: true
                    },
                    {
                        name: locale('status.os'),
                        value: locale('status.os_format', osName, osVersion),
                        inline: true
                    },
                    {
                        name: '📦 Cluster',
                        value: `Cluster ${this.discord.cluster.id + 1} / ${this.discord.cluster.count} (Shard #${message.guild.shardId + 1})`,
                        inline: true
                    },
                ],
                footer: { text: locale('status.node_version', nodeVersion) }
            })]
        });
    }
}