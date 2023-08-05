const Command = require("../../types/command");
const { RadioPlayer, RadioPlayerEvent, RadioStation } = require("@prevter/tavr-media-radio")

const stations = {
    "hit": "HitFM",
    "hitu": "HitFM - Ukraine",
    "hitb": "HitFM - Best",
    "hitt": "HitFM - Top",
    "radio3bayraktar": "Bayraktar",
    "roks": "Roks",
    "roksukr": "Roks - Ukraine",
    "kiss": "Kiss FM",
    "kissukr": "Kiss FM - Ukraine",
    "kissdeep": "Kiss FM - Deep",
    "kissdigital": "Kiss FM - Digital",
    "relax": "Relax",
    "relaxukr": "Relax - Ukraine",
    "relaxint": "Relax - International",
    "relaxcafe": "Relax - Cafe",
    "relaxinstrumental": "Relax - Instrumental",
    "melodia": "Melodia FM",
    "melodiaint": "Melodia FM - International",
    "melodiad": "Melodia FM - Disco",
    "melodiar": "Melodia FM - Romantic",
    "nasheradio": "Nashe Radio",
    "nasheradio3ukr": "Nashe Radio - Ukraine",
    "jazz": "Radio Jazz",
    "jazz3ukr": "Radio Jazz - Ukraine",
    "news": "United News",
    // other stations (can't fit them all in 25 choices)
    "rokscla": "Roks - Classic",
    "rokshar": "Roks - Hard'n'Heavy",
    "roksbal": "Roks - Ballads",
    "jazz3gold": "Radio Jazz - Gold",
    "jazz3light": "Radio Jazz - Light",
    "jazz3cover": "Radio Jazz - Cover",
    "jazz3groove": "Radio Jazz - Groove",
    "radio3classic": "Classic Radio",
    "radio3guliay": "Guliay Radio",
    "radio3gold": "Radio Gold",
    "radio3flash": "Flash Radio",
    "radio3indieua": "Indie.UA Radio",
    "radio3ritmo_latino": "Radio Ritmo Latino",
}

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'radio',
            aliases: [],
            category: 'music',
            guild_only: true,
            args: [{
                name: 'station',
                type: 'choice',
                required: true,
                choices: [...Object.keys(stations).slice(0, 25).map(s => ({
                    name: stations[s],
                    value: s
                }))],
            }]
        });
    }

    async setupRadioPlayer(player, context, station_name, locale) {
        player.on(RadioPlayerEvent.Error, async (err) => {
            await context.reply({ embeds: [Command.createErrorEmbed(locale('radio.error', station_name))] });
            this.logger.error('Radio', `Failed to play radio station ${station_name}:`, err);
            player.stop();
        });

        player.on(RadioPlayerEvent.Song, async () => {
            // get distube queue
            const queue = this.discord.distube.getQueue(context);

            // if not playing radio, stop player
            if (!queue?.songs[0]?.metadata?.radio_player || queue.songs[0].metadata.radio_player !== player) {
                player.stop();
                return;
            }

            // simulate playSong event
            this.discord.distube.emit('playSong', queue, { 
                radio_player: player, 
                user: context.member.user,
            });
        });
    }

    async runAsSlash(interaction, locale, args) {
        const voiceChannel = interaction.member?.voice?.channel;
        if (!voiceChannel)
            return await interaction.reply({ embeds: [Command.createErrorEmbed(locale('music.no_voice'))] });

        const station = args.station;
        const station_name = stations[station] ?? station;

        await interaction.deferReply();

        try {
            const player = new RadioPlayer({ station: station });
            player.station_name = station_name;
            const play_url = player.getPlayerURL(true);

            this.setupRadioPlayer(player, interaction, station_name, locale);

            await this.discord.distube.play(voiceChannel, play_url, {
                textChannel: interaction.channel,
                member: interaction.member,
                skip: true,
                interaction,
                metadata: { radio_player: player }
            });

            await interaction.editReply({ embeds: [Command.createEmbed({ description: locale('radio.success', station_name) })] })
        }
        catch (ex) {
            await interaction.editReply({ embeds: [Command.createErrorEmbed(locale('radio.error', station_name))] });
            this.logger.error('Radio', `Failed to play radio station ${station_name}:`, ex);
        }
    }

    async run(message, locale, args) {
        const voiceChannel = message.member?.voice?.channel;
        if (!voiceChannel)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('music.no_voice'))] });

        const arg = args.join(' ');

        if (!arg) {
            // show list of stations
            const sorted_stations = Object.keys(stations).sort((a, b) => stations[a].localeCompare(stations[b]));
            const embed = Command.createEmbed({
                title: locale('radio.stations'),
                description: sorted_stations.map(s => `**${stations[s]}** - \`${s}\``).join('\n')
            });
            return await message.reply({ embeds: [embed] });
        }

        const station = stations[arg] ? arg : Object.keys(stations).find(s => stations[s].includes(arg) || s.includes(arg));
        const station_name = stations[station] ?? station;

        if (!station)
            return await message.reply({ embeds: [Command.createErrorEmbed(locale('radio.not_found'))] });

        try {
            const player = new RadioPlayer({ station: station });
            player.station_name = station_name;
            const play_url = player.getPlayerURL(true);

            this.setupRadioPlayer(player, message, station_name, locale);

            await this.discord.distube.play(voiceChannel, play_url, {
                textChannel: message.channel,
                member: message.member,
                skip: true,
                message,
                metadata: { radio_player: player }
            });

            await message.react('✅');
        }
        catch (ex) {
            await message.reply({ embeds: [Command.createErrorEmbed(locale('radio.error', station_name))] });
            this.logger.error('Radio', `Failed to play radio station ${station_name}:`, ex);
        }

    }
}