# SashkoBot
Multipurpose Discord bot. Supports multiple languages, has a lot of commands and features. Can work with prefix commands and slash commands. Has an XP system, economy, music, moderation, and much more. *(MEE6 replacement)*  
This is a third iteration of this project, written in JavaScript.  
**Currently in beta.**

## Running
Install all requirements using npm:
```
npm i
```

Rename `config.example.json` to `config.json` and fill it with your bot token and prefix. You can also change other settings there.  
You should also change settings for database connection. Supported database backends are:
- `sqlite` - SQLite database. Connection string should be the path to the database file. Example: `"./storage.db"`

> (more coming soon)

## Commands
### Admin
- `experience` - Toggle XP system for this server.
- `language <language code>` - Change bot language for this server.
- `prefix <prefix>` - Change bot prefix for this server.

### General
- `help [category|command]` - Show help message.
- `invite` - Get bot invite link.

### Levels
- `rank [user]` - Show user rank card.

### Moderator
- `ban <user> [reason]` - Ban user.
- `kick <user> [reason]` - Kick user.
- `mute <user> <duration> [reason]` - Mute user.
- `unban <user>` - Unban user.
- `unmute <user>` - Unmute user.

### Music
- `join` - Join voice channel.
- `leave` - Leave voice channel.
- `nowplaying` - Show currently playing song.
- `play <query>` - Play song by query or URL.

### Search
- `anime <query>` - Search for anime.
- `imgur <query>` - Search for image on Imgur.
- `manga <query>` - Search for manga.
- `urban <query>` - Search for term on Urban Dictionary.

### Utils
- `warstats` - Get statistics of russian losses in war with Ukraine.
- `weather <city>` - Get weather for city.

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

This will work with both prefix and slash commands, but only if your command is simple enough. If for example you a command with arguments, you'll need to override `runAsSlash` method. Here is an example of a command with arguments:
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
        interaction.reply(args.text);
    }

    async run(message, locale, args) {
        message.reply(args.join(' '));
    }
}
```

Notice that `args` inside `runAsSlash` method is an object, not an array. If you only need to parse arguments, you can do that in `runAsSlash`, convert them to an array and call `run` method like this (code from `admin/prefix.js`):
```js
async runAsSlash(interaction, locale, args) {
    let arg = [];
    if (args.prefix) {
        arg.push(args.prefix);
    }
    await this.run(interaction, locale, arg);
}
```
This will emulate the same behavior as `run` method, but with getting arguments from slash command.

For more examples, check existing commands.

After that, you should edit localization files by adding your command name as object to the root element and by setting `"_description"`, `"_usage"` and `"_args_desc"` keys. Only `"_description"` is required, other keys are optional. (Note that `"_usage"` is a string, containing only part after command name)

Example:
```json
{
    "echo": {
        "_args_desc": {
            "text": "Text to echo"
        },
        "_description": "Echo command description",
        "_usage": "<text>",
        ... Other keys required for localization ...
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
> Note: bot is still in beta, so this context may change in the future.
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
    
    async getGuilds() { notImplemented(); }
    async getGuild(guild_id) { notImplemented(); }
    async createGuild(guild) { notImplemented(); }
    async updateGuild(guild) { notImplemented(); }
    async deleteGuild(guild_id) { notImplemented(); }

    async getUsers() { notImplemented(); }
    async getUser(user_id, guild_id) { notImplemented(); }
    async createUser(user) { notImplemented(); }
    async updateUser(user) { notImplemented(); }
    async deleteUser(user_id, guild_id) { notImplemented(); }
    
    async getProfiles() { notImplemented(); }
    async getProfile(user_id) { notImplemented(); }
    async createProfile(profile) { notImplemented(); }
    async updateProfile(profile) { notImplemented(); }
    async deleteProfile(user_id) { notImplemented(); }
}
```

`init` and `close` methods are called when bot starts and stops, so you can use them to initialize and close database connection. Take a look at how it's done in `sqlite.js` backend.
```js
init() {
    this.logger.info('📅 Connecting to SQLite database...');
    this.db = new sqlite3.Database(this.connection_string);

    // Create tables
    this.db.serialize(() => {
        this.db.run(`CREATE TABLE IF NOT EXISTS guilds (
            id TEXT PRIMARY KEY,
            prefix TEXT NOT NULL,
            language TEXT NOT NULL,
            xp_enabled INTEGER NOT NULL
        )`);

        this.db.run(`CREATE TABLE IF NOT EXISTS users (
            id TEXT,
            guild_id TEXT NOT NULL,
            xp INTEGER NOT NULL,
            message_count INTEGER NOT NULL,
            last_message INTEGER NOT NULL,
            PRIMARY KEY (id, guild_id)
        )`);

        this.db.run(`CREATE TABLE IF NOT EXISTS profiles (
            id TEXT PRIMARY KEY,
            card_color TEXT NOT NULL,
            card_background TEXT NOT NULL,
            card_opacity INTEGER NOT NULL
        )`);
    });
}

close() {
    this.db.close();
}
```

Other methods should be self-explanatory, but if you need help, you can take a look at `sqlite.js` backend. Note that they all should be asynchronous, so you'll need to use Promises or async/await.