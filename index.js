const { 
	Client, 
	Events, 
	GatewayIntentBits, 
	SlashCommandBuilder, 
	REST, 
	Routes, 
	PermissionsBitField,
	PermissionFlagsBits
} = require('discord.js');
const { token, prefix, case_sensitive } = require('./config.json');
const db = require('better-sqlite3')('storage.db');

// Initialize database
const initSQL = `
CREATE TABLE IF NOT EXISTS locales (
	id INTEGER PRIMARY KEY NOT NULL,
	locale TEXT NOT NULL DEFAULT en
);`;
db.exec(initSQL);

const commandsPath = require("path").join(__dirname, "commands");
let commands = new Array();
let slashCommands = new Array();

require("fs").readdirSync(commandsPath).forEach(function(file) {
	commands.push(require("./commands/" + file));
});

const client = new Client({ intents: [
	GatewayIntentBits.DirectMessages,
	GatewayIntentBits.Guilds,
	GatewayIntentBits.GuildBans,
	GatewayIntentBits.GuildMessages,
	GatewayIntentBits.MessageContent,
] });

const getServerLocale = (guild) => {
	const sql = `SELECT * FROM locales WHERE id = ?`
	const row = db.prepare(sql).get(guild);
	return row ? row.locale : 'en';
};

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.id}`);
	
	for (const cmd of commands) {
		let descTranslations = {};
		for (const [lang, translations] of Object.entries(cmd.translations)) {
			if (lang === "en") continue;
			descTranslations[lang] = translations.desc;
		}
		
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
			case 'string':
			case 'number':
				builder.addStringOption(option => 
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
				Routes.applicationCommands(c.user.id),
				{ body: cmds },
			);
			console.log(`Successfully reloaded ${data.length} application (/) commands.`);
		} catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error);
		}
	})();
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
				args[arg.name] = interaction.options.getString(arg.name);
				break;
			case 'number':
				const value = interaction.options.getString(arg.name);
				if (!value) break;
				let parsed = parseInt(value);
				if (isNaN(parsed)) parsed = undefined;
				args[arg.name] = parsed;
				break;
			}
		}
		
		const meta = {
			type: 'slash',
			interaction: interaction,
			guild: interaction.guild,
			author: interaction.user,
			channel: interaction.channel,
			member: interaction.member
		}
		
		command.run(args, db, interaction.locale, result => {
			switch (result.type) {
			case 'null':
				interaction.editReply({ content: 'You don\'t have permissions for this command', ephemeral: true});
				break;
			case 'text':
				interaction.editReply(result.content);
				break;
			case 'embed':
				interaction.editReply({ embeds: [result.content] });
				break;
			}
		}, meta);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

client.on("messageCreate", async (message) => {
	// return if used without prefix, or send by bot
	if (message.author.bot) return;
	if (!case_sensitive && !message.content.toLowerCase().startsWith(prefix)) return;
	if (case_sensitive && !message.content.startsWith(prefix)) return;
	
	const args = message.content.slice(prefix.length).split(/\s+/);
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
		if (command.permissions && message.member) {
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
		var index = 1;
		for (const arg of command.arguments) {
			parsedArgs[arg.name] = arg.defaultValue ?? undefined;
			
			if (args[index]) {
				switch (arg.type) {
				case 'string':
					parsedArgs[arg.name] = args[index];
					break;
				case 'number':
					let parsed = parseInt(args[index]);
					if (isNaN(parsed)) parsed = undefined;
					parsedArgs[arg.name] = parsed;
					break;
				}
			}
			
			index++;
		}
		
		const locale = getServerLocale(message.guildId);
		
		const meta = {
			type: 'prefix',
			message: message,
			guild: message.guild,
			author: message.author,
			channel: message.channel,
			member: message.member
		};
		
		command.run(parsedArgs, db, locale, result => {
			switch (result.type) {
			case 'null':
				break;
			case 'text':
				message.reply(result.content);
				break;
			case 'embed':
				message.reply({ embeds: [result.content] });
				break;
			}
		}, meta);
	}
});

client.login(token);

process.on('exit', () => db.close());
process.on('SIGHUP', () => process.exit(128 + 1));
process.on('SIGINT', () => process.exit(128 + 2));
process.on('SIGTERM', () => process.exit(128 + 15));