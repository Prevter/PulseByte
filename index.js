const {
	Client,
	Events,
	GatewayIntentBits,
	SlashCommandBuilder,
	REST,
	Routes,
	PermissionsBitField,
	PermissionFlagsBits,
	ActivityType
} = require('discord.js');

const { DisTube } = require('distube')
const { SpotifyPlugin } = require('@distube/spotify')
const { SoundCloudPlugin } = require('@distube/soundcloud')
const { YtDlpPlugin } = require('@distube/yt-dlp')
const { Player } = require("discord-player")
const { token, prefixes, case_sensitive, activity_name, activity_type, owner_id } = require('./config.json');
const db = require('better-sqlite3')('storage.db');
const createEmbed = require('./common/playingEmbed')

// Initialize database
const initSQL = `
CREATE TABLE IF NOT EXISTS locales (
	id INTEGER PRIMARY KEY NOT NULL,
	locale TEXT NOT NULL DEFAULT en
);
CREATE TABLE IF NOT EXISTS experience (
	user_id TEXT NOT NULL,
	guild_id INTEGER NOT NULL,
	xp INTEGER NOT NULL,
	last_message INTEGER NOT NULL,
	PRIMARY KEY (user_id, guild_id)
);
CREATE TABLE IF NOT EXISTS settings (
	guild_id TEXT PRIMARY KEY NOT NULL,
	xp_enabled INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS trusted (
	user_id TEXT PRIMARY KEY NOT NULL
);`;
db.exec(initSQL);

const path = require('path');
const { config } = require('process');
const { isTrusted } = require('./common/utils');

const client = new Client({
	intents: [
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildBans,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessageTyping,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildPresences,
	]
});

const player = new Player(client);
client.player = player;
client.distube = new DisTube(client, {
	leaveOnStop: false,
	leaveOnFinish: false,
	emitNewSongOnly: true,
	emitAddSongWhenCreatingQueue: false,
	emitAddListWhenCreatingQueue: false,
	plugins: [
		new SpotifyPlugin({
			emitEventsAfterFetching: true
		}),
		new SoundCloudPlugin(),
		new YtDlpPlugin()
	]
});

client.distube.on("playSong", async (queue, song) => {
	const locale = getServerLocale(queue.textChannel.guild.id);
	const embed = createEmbed(song, locale, queue, false);
	queue.message = await queue.textChannel.send({ embeds: [embed] });
});

client.distube.on("finishSong", async (queue, song) => {
	if (queue.message) {
		await queue.message.delete();
		queue.message = null;
	}
});

const getServerLocale = (guild) => {
	const sql = `SELECT * FROM locales WHERE id = ?`
	const row = db.prepare(sql).get(guild);
	return row ? row.locale : 'en';
};

let commands = new Array();
let slashCommands = new Array();
let modules = new Array();

const reloadCommands = () => {
	// clear commands
	commands = new Array();
	slashCommands = new Array();
	modules = new Array();

	const commandsPath = path.join(__dirname, "commands");
	require("fs").readdirSync(commandsPath).forEach(function (file) {
		if (require.cache[require.resolve("./commands/" + file)]) {
			delete require.cache[require.resolve("./commands/" + file)];
		}
		commands.push(require("./commands/" + file));
	});

	const modulesPath = path.join(__dirname, "modules");
	require("fs").readdirSync(modulesPath).forEach(function (file) {
		if (require.cache[require.resolve("./modules/" + file)]) {
			delete require.cache[require.resolve("./modules/" + file)];
		}
		modules.push(require("./modules/" + file));
	});

	// register slash commands
	for (const cmd of commands) {
		let descTranslations = {};
		if (cmd.ownerOnly) continue;

		for (const [lang, translations] of Object.entries(cmd.translations)) {
			if (lang === "en") continue;
			descTranslations[lang] = translations.desc;
		}

		console.log(`Registering slash command ${cmd.name}`);

		let builder = new SlashCommandBuilder()
			.setName(cmd.name)
			.setDescription(cmd.translations.en.desc)
			.setDescriptionLocalizations(descTranslations);

		for (const arg of cmd.arguments) {
			let argTranslations = {};
			for (const [lang, translations] of Object.entries(cmd.translations)) {
				if (lang === "en") continue;
				argTranslations[lang] = translations.args[arg.name];
			}

			switch (arg.type) {
				case 'number':
					builder.addNumberOption(option =>
						option.setName(arg.name)
							.setDescription(cmd.translations.en.args[arg.name])
							.setDescriptionLocalizations(argTranslations)
							.setRequired(arg.isRequired ?? false));
					break;
				case 'string':
					builder.addStringOption(option => {
						option.setName(arg.name)
							.setDescription(cmd.translations.en.args[arg.name])
							.setDescriptionLocalizations(argTranslations)
							.setRequired(arg.isRequired ?? false);


						if (arg.choices) {
							for (const choice of arg.choices) {
								option.addChoices({ name: choice, value: choice })
							}
						}

						return option
					});
					break;
				case 'user':
					builder.addUserOption(option =>
						option.setName(arg.name)
							.setDescription(cmd.translations.en.args[arg.name])
							.setDescriptionLocalizations(argTranslations)
							.setRequired(arg.isRequired ?? false));
					break;
				case 'boolean':
					builder.addBooleanOption(option =>
						option.setName(arg.name)
							.setDescription(cmd.translations.en.args[arg.name])
							.setDescriptionLocalizations(argTranslations)
							.setRequired(arg.isRequired ?? false));
					break;
			}



		}

		if (cmd.permissions) {
			let flags = null;
			for (const perm of cmd.permissions) {
				if (!flags) flags = PermissionFlagsBits[perm];
				else flags |= PermissionFlagsBits[perm];
			}
			if (flags)
				builder.setDefaultMemberPermissions(flags);
		}

		if (cmd.guildOnly)
			builder.setDMPermission(!cmd.guildOnly)

		slashCommands.push({
			data: builder,
			module: cmd
		});
	}

	const cmds = [];
	for (const cmd of slashCommands) {
		cmds.push(cmd.data.toJSON());
	}

	const rest = new REST({ version: '10' }).setToken(token);
	(async () => {
		try {
			console.log(`Started refreshing ${cmds.length} application (/) commands.`);
			// await rest.put(Routes.applicationCommands(c.user.id), { body: [] });
			const data = await rest.put(
				Routes.applicationCommands(client.user.id),
				{ body: cmds },
			);
			console.log(`Successfully reloaded ${data.length} application (/) commands.\n`);
		} catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}
	})();
}

client.reloadCommands = reloadCommands;

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.id}`);

	// change activity
	client.user.setActivity({
		name: activity_name,
		type: ActivityType[activity_type]
	});

	// load commands
	reloadCommands();
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	let command = null;
	for (const cmd of commands) {
		if (interaction.commandName === cmd.name) {
			command = cmd;
			break;
		}
	}

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	if (command.permissions && interaction.member) {
		for (const perm of command.permissions) {
			if (!interaction.member.permissions.has(PermissionsBitField.Flags[perm])) {
				return;
			}
		}
	}

	if (command.guildOnly && !interaction.guild) {
		return;
	}

	try {
		await interaction.deferReply();
		// parse arguments
		let args = {};
		for (const arg of command.arguments) {
			args[arg.name] = arg.defaultValue ?? undefined;

			switch (arg.type) {
				case 'string':
					const strValue = interaction.options.getString(arg.name);
					if (!strValue) break;
					args[arg.name] = strValue;
					break;
				case 'number':
					const numValue = interaction.options.getNumber(arg.name);
					if (!numValue) break;
					args[arg.name] = numValue;
					break;
				case 'user':
					args[arg.name] = interaction.options.getUser(arg.name);
					break;
				case 'boolean':
					args[arg.name] = interaction.options.getBoolean(arg.name);
					break;
			}
		}

		const meta = {
			type: 'slash',
			message: interaction,
			guild: interaction.guild,
			author: interaction.user,
			channel: interaction.channel,
			member: interaction.member,
			client: client
		}

		try {
			command.run(args, db, interaction.locale, result => {
				switch (result.type) {
					case 'null':
						interaction.editReply({ content: 'You don\'t have permissions for this command', ephemeral: true });
						break;
					case 'custom':
					case 'text':
						interaction.editReply(result.content);
						break;
					case 'embed':
						interaction.editReply({ embeds: [result.content] });
						break;
					case 'react':
						interaction.editReply({ content: result.content });
						break;
					case 'attachment':
						interaction.editReply({ files: [result.content] });
						break;
				}
			}, meta);
		} catch (error) {
			console.error(error);
		}
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

async function getUserFromMention(guild, mention) {
	return new Promise((resolve, reject) => {
		if (!mention) return;

		if (mention.startsWith('<@') && mention.endsWith('>')) {
			mention = mention.slice(2, -1);
			if (mention.startsWith('!')) {
				mention = mention.slice(1);
			}
		}

		guild.members.fetch(mention)
			.then(resolve)
			.catch(console.error);
	});
}

client.on("messageCreate", async (message) => {
	// return if used without prefix, or send by bot
	if (message.author.bot) return;

	// check all modules
	for (const module of modules) {
		if (module.onMessage) {
			module.onMessage(message, db, client);
		}
	}

	var content = message.content;
	if (!case_sensitive) {
		content = message.content.toLowerCase();
	}

	// "prefix" is an array of strings
	for (var i = 0; i < prefixes.length; i++) {
		if (content.startsWith(prefixes[i])) {
			content = message.content.slice(prefixes[i].length);
			break;
		}
	}

	// return if used without prefix
	if (content === message.content) return;

	const args = content.split(/\s+/);
	let command = null;
	commands.every(cmd => {
		if (cmd.name === args[0]) {
			command = cmd;
			return false;
		}
		for (var i = 0; i < cmd.aliases.length; i++) {
			if (cmd.aliases[i] === args[0]) {
				command = cmd;
				return false;
			}
		}
		return true;
	});

	if (command) {
		const trusted = isTrusted(db, message.author.id);

		if (command.ownerOnly && !trusted) {
			return;
		}

		if (command.permissions && message.member && !trusted) {
			for (const perm of command.permissions) {
				if (!message.member.permissions.has(PermissionsBitField.Flags[perm])) {
					return;
				}
			}
		}

		if (command.guildOnly && !message.guild) {
			return;
		}

		//parse all arguments
		let parsedArgs = {};

		if (command.customPrefixArgs) {
			parsedArgs = args;
		}
		else {
			var index = 1;
			for (const arg of command.arguments) {
				parsedArgs[arg.name] = arg.defaultValue ?? undefined;

				if (args[index]) {
					switch (arg.type) {
						case 'string':
							if (arg.longString && arg.useQuotes && args[index].startsWith('"')) {
								parsedArgs[arg.name] = args[index].slice(1);
								index++;
								while (index < args.length) {
									if (args[index].endsWith('"')) {
										parsedArgs[arg.name] += ' ' + args[index].slice(0, -1);
										break;
									}
									parsedArgs[arg.name] += ' ' + args[index];
									index++;
								}
							}
							else if (arg.longString && !arg.useQuotes) {
								parsedArgs[arg.name] = args[index];
								index++;
								while (index < args.length) {
									parsedArgs[arg.name] += ' ' + args[index];
									index++;
								}
							}
							else {
								parsedArgs[arg.name] = args[index];
							}
							break;
						case 'number':
							let parsed = parseInt(args[index]);
							if (isNaN(parsed)) parsed = undefined;
							parsedArgs[arg.name] = parsed;
							break;
						case 'user':
							const member = await getUserFromMention(message.guild, args[index]);
							parsedArgs[arg.name] = member;
							break;
						case 'boolean':
							if (args[index] === 'true') {
								parsedArgs[arg.name] = true;
							}
							else if (args[index] === 'false') {
								parsedArgs[arg.name] = false;
							}
							else {
								parsedArgs[arg.name] = undefined;
							}
							break;
					}
				}

				index++;
			}
		}

		const locale = getServerLocale(message.guildId);

		const meta = {
			type: 'prefix',
			message: message,
			guild: message.guild,
			author: message.author,
			channel: message.channel,
			member: message.member,
			client: client,
		};

		try {
			command.run(parsedArgs, db, locale, result => {
				switch (result.type) {
					case 'null':
						break;
					case 'text':
						if (result.reply === false)
							message.channel.send(result.content);
						else
							message.reply(result.content);
						break;
					case 'embed':
						if (result.reply === false)
							message.channel.send({ embeds: [result.content] });
						else
							message.reply({ embeds: [result.content] });
						break;
					case 'react':
						message.react(result.content);
						break;
					case 'attachment':
						if (result.reply === false)
							message.channel.send({ files: [result.content] });
						else
							message.reply({ files: [result.content] });
				}
			}, meta);
		}
		catch (err) {
			console.error(err);
		}

	}
});


client.login(token);

process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));
process.on('uncaughtException', function (err) {
	console.log('Exception:', err);
});