# SashkoBot
Multipurpose Discord bot. Supports multiple languages, has a lot of commands and features. Can work with prefix commands and slash commands. Has an XP system, economy, music, moderation, and much more. *(MEE6 replacement)*  
This is a third iteration of this project, written in JavaScript. 

## Running
Install all requirements using npm:
```
npm i
```

### Config file
Rename `config.example.json` to `config.json` and fill it with your bot token and prefix. You can also change other settings there.  

Example config file:
```js
{
    "name": "My Bot", // Bot name
    "default_language": "en", // Default language code
    "bot": {
        "token": "<Discord Bot Token>", // Your bot token
        "prefix": "-", // Default bot prefix
        "owners": [ // Array of bot owners
            "400199033915965441"
        ],
        "embed_color": "#0099FF", // Default embed color
        "error_embed_color": "#F04848", // Default embed color for error messages
        "activity": { // Bot activity (displayed in status)
            "status": "online", // Bot status (online, idle, dnd, invisible)
            "type": "PLAYING", // Bot activity type (PLAYING, STREAMING, LISTENING, WATCHING, COMPETING)
            "name": "-help" // Bot activity text
        },
        "xp": { // XP system settings
            "enabled": true,
            "cooldown": 60, // XP cooldown in seconds
            "min": 15, // Minimum XP per message
            "max": 25, // Maximum XP per message
            "card": { // Rank card default settings
                "accent_color": "#ffbb5c", // Rank card accent color (for progress bar and level number)
                "background": "#090a0b", // Rank card background color
                "background_opacity": 100 // Rank card background opacity (0-100)
            }
        },
        "buttons_timeout": 60000, // Timeout for buttons used in some commands
        "about": { // If any of these fields are not specified, they will be hidden in the about command
            "repo": "https://github.com/Prevter/SanyaBot", // Bot repository URL
            "support": "https://discord.gg/FDyJVPFNT7" // Bot support server URL
        }
    },
    "database": { // Database settings
        "type": "mongodb", // Database backend (sqlite, mongodb)
        "connection_string": "mongodb://127.0.0.1:27017/bot", // Database connection string
        "enable_backup": false, // Enable database backup
        "backup_interval": 3600000, // Database backup interval in milliseconds
        "backup_count": 5, // Number of backups to keep
        "backup_path": "./backups/", // Path to store backups
        "backup_on_start": false // Create backup on bot start
    },
    "web": { // Web server settings
        "port": 80, // Web server port
        "url": "http://localhost/" // Default web server URL
    },
    "logger": { // Logger settings
        "level": "info", // Minimum log level (log, info, warn, error, fatal)
        "file": { // File logger settings
            "enable": true,
            "path": "./logs.log" // Path to log file
        },
        "stdout": { // Console logger settings
            "enable": true
        },
        "webhook": { // Discord webhook logger settings
            "enable": false,
            "override_level": null, // Same as logger.level, but for webhook logger if you want to log only errors for example
            "url": "" // Discord webhook URL
        }
    },
    "imgur_client_id": "<Imgur Client ID>", // Imgur client ID for image search command
    "weather_api_key": "<OpenWeatherMap API Key>" // OpenWeatherMap API key for weather command
}
```


You should also change settings for database connection. Supported database backends are:
- `sqlite` - SQLite database. Connection string should be the path to the database file.  
Example: `"./storage.db"`
- `mongodb` - MongoDB database. Connection string should be a valid MongoDB connection string.  
Example: `"mongodb://127.0.0.1:27017/dbname"`

Run the bot:
```
npm run start
```

## Commands
### Admin
- `experience` - Toggle XP system for this server.
- `language <language code>` - Change bot language for this server.
- `prefix <prefix>` - Change bot prefix for this server.

### General
- `about` - Show information about bot.
- `help [category|command]` - Show help message.
- `invite` - Get bot invite link.
- `status` - Show bot status.

### Levels
- `leaderboard` - Show server leaderboard.
- `rank [user]` - Show user rank card.

### Moderator
- `ban <user> [reason]` - Ban user.
- `clean <count>` - Delete messages.
- `kick <user> [reason]` - Kick user.
- `mute <user> <duration> [reason]` - Mute user.
- `unban <user>` - Unban user.
- `unmute <user>` - Unmute user.

### Music
- `autoplay` - Toggle autoplay mode.
- `filter [filter]` - Change audio filter.
- `join` - Join voice channel.
- `leave` - Leave voice channel.
- `nowplaying` - Show currently playing song.
- `pause` - Pause/resume playing.
- `play <query>` - Play song by query or URL.
- `playnow <query>` - Add song to the front of the queue.
- `playskip <query>` - Play song by query or URL and skip current song.
- `previous` - Play previous song.
- `queue` - Show queue.
- `repeat <off|song|queue>` - Change repeat mode.
- `seek <time>` - Seek to time in song.
- `shuffle` - Shuffle queue.
- `skip [count]` - Skip current song (or multiple songs).
- `stop` - Stop playing and clear queue.
- `volume <volume>` - Change volume.

### Owner-only
- `reload` - Reload all commands and localization files without restarting (hot reload, useful when adding new commands).

### Search
- `anime <query>` - Search for anime.
- `imgur <query>` - Search for image on Imgur.
- `manga <query>` - Search for manga.
- `urban <query>` - Search for term on Urban Dictionary.

### Utils
- `warstats` - Get statistics of russian losses in war with Ukraine.
- `weather <city>` - Get weather for city.

## Custom commands
This bot has a support for custom commands, which can be defined by guild admins.
> **Note:** Currently, there is no way to add custom commands, except by directly editing database. This will be fixed in future by implementing a web interface for managing custom commands.
Database structure for a custom command is following:
```json
{
    "guild_id": "123456789012345678",
    "name": "test",
    "use_prefix": true,
    "mode": "normal",
    "code": "..."
}
```
- `guild_id` - ID of guild, where this command is defined.
- `name` - Name of command (or regex pattern, if `mode` is set to `regex`)
- `use_prefix` - Whether to only match this command if it starts with prefix.
- `mode` - Command mode. Can be `normal`, `regex`, `startsWith`, `endsWith` or `contains`
- `code` - Code to execute when command is matched. Check [documentation](#custom-command-code-documentation) for creating custom commands.

### **Custom command code documentation**
> **Note:** This documentation will be updated in future, when more features will be added.

To abstract away the process of creating custom commands, a simple scripting language was implemented. It is very simple and has only a few commands.

Basic syntax looks like this:
```
{[ <command> <arg1> <arg2> <arg3> ... ]}
```
It also has a way to save values to variables and use them.  
For example, you can reply to a message with a copy of it, by using this code:
```
{[ reply "You sent: `%$content%`" ]}
```
Notice that variable name is surrounded by `%` symbols. This is how you can use variables in strings. $content is a special variable, which contains the content of the message, which triggered this command.

Here is a list of all available commands:
- `reply <string | json embed> [handle]` - Reply to message with text. If handle is provided, save it to variable with that name.
- `send <string | json embed> [handle]` - Same as reply, but send a new message instead of replying.
- `send_channel <channel id> <string | json embed> [handle]` - Same as send, but send message to specified channel ID.
- `edit <handle> <string | json embed>` - Edit message with given handle with text or embed.
- `delete [handle]` - Delete message with given handle. If handle is not provided, delete the message, which triggered this command.
- `react <handle> [emoji 1] [emoji 2] ...` - React to message with given handle with emoji. You can provide multiple emojis up to 20 (Discord limit).
- `sleep <time in ms>` - Wait for given amount of time.
- `set <variable name> <value>` - Set variable to given value.
- `choose <variable name> <arg1> <arg2> ...` - Set variable to random value from given arguments.
- `random <variable name> <min> <max>` - Set variable to random number between min and max.

Built-in variables:
- `$author` - User object of author of message, which triggered this command.
- `$channel` - Channel object of channel, where message, which triggered this command, was sent.
- `$guild` - Guild object of guild, where message, which triggered this command, was sent.
- `$message` - Message object of message, which triggered this command.
- `$content` - Content of message, which triggered this command.
- `$mention` - Mention of author of message, which triggered this command.

Example command code:
```
// Any text which is not inside a command block is ignored, so you can use it for comments. It's more readable to use `//` for comments, but it's not required.
// Please note that you can't comment a command block 
{[ react $message ✅ ]} // React to author message with ✅ emoji
// Reply to author message with "Hello, @Username!"
{[ reply "Hello, %$mention%!" reply1 ]} // Save reply to `reply1` variable 
{[ sleep 5000 ]} // Sleep for 5 seconds
// Edit message with `reply1` handle with "Hello, @Username! I'm a bot!"
{[ edit reply1 "Hello, %$mention%! I'm a bot!" ]}
{[ delete ]} // Delete original message
// You can use JSON to create embeds
{[ send { 
    "title": "Custom embed!", 
    "description": "This is a custom embed, which was sent by custom command!",
    "color": "#ff0000",
    "footer": { "text": "This is a footer!" }
} reply2 ]}
{[ react reply2 ✅ ❌ ]} // Add reactions to latest message
```

Example dice command:
```
{[ random dice 1 6 ]} // Store random number between 1 and 6 to `dice` variable
{[ reply {
    "title": "🎲 Dice",
    "description": "You rolled **%dice%**!"
} ]}
```

Example coin flip command:
```
{[ set heads "<:heads:1078314870925185135> Heads" ]} // Using custom emoji
{[ set tails "<:tails:1078314873982824519> Tails" ]}
{[ choose coin heads tails ]} // Choose random value from `heads` and `tails` variables and store it to `coin` variable
{[ reply {
    "title": "Coin flip",
    "description": "**%coin%**"
} ]}
```

## Adding new commands
Adding new commands is very easy. To do that, a simple framework was implemented, to wrap the creation of new commands. To create a new command, go into src/commands folder, choose a category folder or create one and create a new file inside with the name of your new command.

Example: `src/commands/general/ping.js`

Then, you need to add some code to your file. Here is an example of a simple ping command:
```js
const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'ping',
            aliases: ['pong'],
            category: 'general'
        });
    }

    async run(message, locale, args) {
        message.reply("Pong!");
    }
}
```

This will work with both prefix and slash commands, but only if your command is simple enough. If for example you have a command with arguments, you'll need to override `runAsSlash` method. Here is an example of a command with arguments:
```js
const Command = require("../../types/command");

module.exports = class extends Command {
    constructor(client, database) {
        super(client, database, {
            name: 'echo',
            aliases: [],
            category: 'general',
            args: [{
                name: 'text',
                type: 'string',
                required: true
            }]
        });
    }

    async runAsSlash(interaction, locale, args) {
        // `args` is an object, not an array
        interaction.reply(args.text);
    }

    async run(message, locale, args) {
        // `args` is an array
        message.reply(args.join(' '));
    }
}
```

Notice that `args` inside `runAsSlash` method is an object, not an array. Usually, you won't need to override `runAsSlash` method, because it will automatically call `run` method with arguments converted to array like this:
```js
async runAsSlash(interaction, locale, args) {
    await this.run(interaction, locale, Object.values(args));
}
```
This will emulate the same behavior as `run` method, but with arguments converted to array.

For more examples, check existing commands.

After that, you should edit localization files by adding your command name as object to the root element and by setting `"_description"`, `"_usage"` and `"_args_desc"` keys. Only `"_description"` is required, other keys are optional. (Note that `"_usage"` is a string, containing only part after command name)

Example:
```jsonc
{
    "echo": {
        "_args_desc": {
            "text": "Text to echo"
        },
        "_description": "Echo command description", // Required
        "_usage": "<text>",
        // Other keys that you can use in localization
        // "greet": "Hello, {0}!"
    }
}
```

By doing that, the bot will automatically register your command and be ready to run it.

## Adding new languages (and using localization)
### Adding new languages
To add a new language, you need to create a new file in `src/locales` folder with the name of your language code. Then, you need to add all keys from `en.json` file and translate them.  
Take a close look at `language` key, because it contains subkey `name` which is the name of your language, it will be displayed in the language selection menu. 

### Using localization
Inside command file, you can access localization function by calling `locale` argument. It's passed inside `run` method and is properly set up to use language chosen for server it is called from.  
It has several features for easy localization:
- `locale('key.subkey.nested_key')` - Get value of key. If key is not found, it will return `null`. You can use dot to access nested keys.
- `locale('command.formatted', value1, value2)` - Use this to format strings. It will replace `{0}`, `{1}`, etc. with values passed as arguments.
- `locale('!key')` - Use exclamation mark to forbid fallback to default language. It's not used as much as other features, but it can be useful in some cases, for example if you want to check if key exists in localization file.
- `locale('_locale')` - Use this to get current locale code.

## Adding new database backends
Database backends are located in `src/database` folder. To add a new one, you need to create a new file with the name of your backend. Then, you need to export a class, which extends `DatabaseContext` class, which you can require like this:
```js
const DatabaseContext = require("../types/db_context");
```

Take a look at interface class to see what methods you need to override.
(You can also take a look at existing backends for examples)
```js
class DatabaseContext {
    /**
     * Creates a new database context instance
     * @param {string} connection_string 
     * @param {Logger} logger 
     */
    constructor(connection_string, logger) {
        this.connection_string = connection_string;
        this.logger = logger;
        this.init();
    }

    /**
     * Initializes the database context
     */
    init() { }
    /**
     * Closes the database context
     */
    close() { }
    
    // `guild` table contains settings for each guild (prefix, language, etc.)
    async getGuilds() { notImplemented(); }
    async getGuild(guild_id) { notImplemented(); }
    async createGuild(guild) { notImplemented(); }
    async updateGuild(guild) { notImplemented(); }
    async deleteGuild(guild_id) { notImplemented(); }

    // `users` table contains statistics for each user for each guild (xp, messages sent)
    async getUsers(guild_id) { notImplemented(); }
    async getUser(user_id, guild_id) { notImplemented(); }
    async createUser(user) { notImplemented(); }
    async updateUser(user) { notImplemented(); }
    async deleteUser(user_id, guild_id) { notImplemented(); }

    // `profiles` table is used for profile cards settings
    async getProfiles() { notImplemented(); }
    async getProfile(user_id) { notImplemented(); }
    async createProfile(profile) { notImplemented(); }
    async updateProfile(profile) { notImplemented(); }
    async deleteProfile(user_id) { notImplemented(); }
    
    // `custom_commands` table is used for custom commands
    async getCustomCommands(guild_id) { notImplemented(); }
    async getCustomCommand(guild_id, command_name) { notImplemented(); }
    async createCustomCommand(command) { notImplemented(); }
    async updateCustomCommand(command) { notImplemented(); }
    async deleteCustomCommand(guild_id, command_name) { notImplemented(); }
}
```

`init` and `close` methods are called when bot starts and stops, so you can use them to initialize and close database connection. Take a look at how it's done in `mongodb.js` backend.
```js
init() {
    this.logger.info('Database', '🥭 Connecting to MongoDB database...');
    this.client = new MongoClient(this.connection_string, { useUnifiedTopology: true });
    this.db = this.client.db();

    // Create collections if they don't exist
    const createCollection = async (name) => {
        const collections = await this.db.listCollections().toArray();
        if (!collections.some(c => c.name === name)) {
            await this.db.createCollection(name);
        }
    };
    
    createCollection('guilds');
    createCollection('users');
    createCollection('profiles');
    createCollection('custom_commands');
}

close() {
    this.client.close();
}
```

Other methods should be self-explanatory, but if you need help, you can take a look at any backend implementation. Note that they all should be asynchronous, so you'll need to use Promises or async/await.